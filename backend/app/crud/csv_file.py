from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.document import CSVFile
from app.schemas.document import CSVFileCreate


class CRUDCSVFile:
    def create(self, db: Session, *, obj_in: CSVFileCreate, total_rows: int = 0) -> CSVFile:
        """Create a new CSV file record"""
        db_obj = CSVFile(
            filename=obj_in.filename,
            total_rows=total_rows,
            status="uploaded"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[CSVFile]:
        """Get a CSV file by ID"""
        return db.query(CSVFile).filter(CSVFile.id == id).first()
    
    def get_by_filename(self, db: Session, *, filename: str) -> Optional[CSVFile]:
        """Get a CSV file by filename"""
        return db.query(CSVFile).filter(CSVFile.filename == filename).first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 20
    ) -> Tuple[List[CSVFile], int]:
        """Get multiple CSV files with pagination"""
        total = db.query(CSVFile).count()
        items = db.query(CSVFile).offset(skip).limit(limit).all()
        return items, total
    
    def update_status(
        self, db: Session, *, db_obj: CSVFile, status: str, imported_count: Optional[int] = None
    ) -> CSVFile:
        """Update CSV file status"""
        db_obj.status = status
        if imported_count is not None:
            db_obj.imported_count = imported_count
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: int) -> CSVFile:
        """Delete a CSV file"""
        obj = db.query(CSVFile).filter(CSVFile.id == id).first()
        if not obj:
            raise ValueError(f"CSVFile with id {id} not found")
        db.delete(obj)
        db.commit()
        return obj


csv_file = CRUDCSVFile()
