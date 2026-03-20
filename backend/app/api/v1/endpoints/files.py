from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pathlib import Path
import csv
import logging
from typing import List
from app.db.session import get_db
from app.crud import csv_file as crud_csv_file
from app.schemas.document import (
    CSVFileResponse,
    PaginatedCSVFileResponse,
)
from app.scripts.import_articles import import_articles_from_csv

logger = logging.getLogger(__name__)

router = APIRouter()

# CSVファイルのアップロードディレクトリ
UPLOAD_DIR = Path("uploaded_csv_files")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=CSVFileResponse)
async def upload_csv_file(
    *,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CSVFileResponse:
    """Upload a CSV file"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    file_path = UPLOAD_DIR / file.filename
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Count total rows
        total_rows = 0
        with open(file_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.reader(f)
            total_rows = sum(1 for row in csv_reader) - 1  # Exclude header
        
        # Create database record
        from app.schemas.document import CSVFileCreate
        db_file = crud_csv_file.create(
            db=db,
            obj_in=CSVFileCreate(filename=file.filename),
            total_rows=total_rows
        )
        
        logger.info(f"Uploaded CSV file: {file.filename}, total_rows: {total_rows}")
        return db_file
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' already exists."
        )
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.get("", response_model=PaginatedCSVFileResponse)
def list_csv_files(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
) -> PaginatedCSVFileResponse:
    """Get list of uploaded CSV files"""
    items, total = crud_csv_file.get_multi(db=db, skip=skip, limit=limit)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
    }


@router.post("/{file_id}/import", response_model=CSVFileResponse)
async def import_csv_to_documents(
    *,
    file_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> CSVFileResponse:
    """Import CSV file to documents"""
    db_file = crud_csv_file.get(db=db, id=file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    if db_file.status == "importing":
        raise HTTPException(status_code=400, detail="File is already being imported")
    
    if db_file.status == "completed":
        raise HTTPException(status_code=400, detail="File has already been imported")
    
    # Update status to importing
    db_file = crud_csv_file.update_status(db=db, db_obj=db_file, status="importing")
    
    file_path = UPLOAD_DIR / db_file.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="CSV file not found on disk")
    
    # Import in background
    def import_task():
        from app.db.session import SessionLocal
        try:
            import_articles_from_csv(str(file_path), skip_existing=True)
            # Update status to completed
            db = SessionLocal()
            try:
                db_file = crud_csv_file.get(db=db, id=file_id)
                if db_file:
                    crud_csv_file.update_status(
                        db=db,
                        db_obj=db_file,
                        status="completed",
                        imported_count=db_file.total_rows
                    )
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error importing file {file_id}: {e}")
            # Update status to failed
            db = SessionLocal()
            try:
                db_file = crud_csv_file.get(db=db, id=file_id)
                if db_file:
                    crud_csv_file.update_status(db=db, db_obj=db_file, status="failed")
            finally:
                db.close()
    
    background_tasks.add_task(import_task)
    
    logger.info(f"Started background import for file_id: {file_id}, filename: {db_file.filename}")
    return db_file


@router.get("/{file_id}", response_model=CSVFileResponse)
def get_csv_file(
    *,
    file_id: int,
    db: Session = Depends(get_db),
) -> CSVFileResponse:
    """Get a CSV file by ID"""
    db_file = crud_csv_file.get(db=db, id=file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="CSV file not found")
    return db_file


@router.delete("/{file_id}")
def delete_csv_file(
    *,
    file_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a CSV file"""
    db_file = crud_csv_file.get(db=db, id=file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    # Delete file from disk
    file_path = UPLOAD_DIR / db_file.filename
    if file_path.exists():
        file_path.unlink()
    
    crud_csv_file.delete(db=db, id=file_id)
    return {"message": "CSV file deleted successfully"}
