# CRUD module
from app.crud.document import document
from app.crud.csv_file import csv_file
from app.crud.analytics import analytics
from app.crud.mention import mention
from app.crud.document_link import document_link

__all__ = ["document", "csv_file", "analytics", "mention", "document_link"]
