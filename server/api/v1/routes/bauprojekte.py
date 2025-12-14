"""
Bauprojekte (Construction Projects) Routes

Admin endpoints for managing construction projects
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from ..data_access.database import get_db_connection

router = APIRouter(prefix="/bauprojekte", tags=["bauprojekte"])


class BauprojektCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[str] = None
    status: str = "active"


class BauprojektUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


@router.get("/")
async def get_all_bauprojekte(status: Optional[str] = None):
    """Get all construction projects, optionally filtered by status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if status:
            query = "SELECT * FROM bauprojekte WHERE status = %s ORDER BY created_at DESC"
            cursor.execute(query, (status,))
        else:
            query = "SELECT * FROM bauprojekte ORDER BY created_at DESC"
            cursor.execute(query)
        
        columns = [desc[0] for desc in cursor.description]
        projects = []
        for row in cursor.fetchall():
            project = dict(zip(columns, row))
            # Convert dates to ISO format
            if project.get('start_date'):
                project['start_date'] = project['start_date'].isoformat()
            if project.get('end_date'):
                project['end_date'] = project['end_date'].isoformat()
            if project.get('created_at'):
                project['created_at'] = project['created_at'].isoformat()
            if project.get('updated_at'):
                project['updated_at'] = project['updated_at'].isoformat()
            projects.append(project)
        
        cursor.close()
        conn.close()
        
        return {"projects": projects}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.get("/{projekt_id}")
async def get_bauprojekt(projekt_id: int):
    """Get a specific construction project by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM bauprojekte WHERE id = %s", (projekt_id,))
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        columns = [desc[0] for desc in cursor.description]
        project = dict(zip(columns, row))
        
        # Convert dates to ISO format
        if project.get('start_date'):
            project['start_date'] = project['start_date'].isoformat()
        if project.get('end_date'):
            project['end_date'] = project['end_date'].isoformat()
        if project.get('created_at'):
            project['created_at'] = project['created_at'].isoformat()
        if project.get('updated_at'):
            project['updated_at'] = project['updated_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return project
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.post("/")
async def create_bauprojekt(projekt: BauprojektCreate):
    """Create a new construction project (Admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO bauprojekte (name, description, location, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, name, description, location, start_date, end_date, status, created_at
        """
        
        cursor.execute(
            query,
            (
                projekt.name,
                projekt.description,
                projekt.location,
                projekt.start_date,
                projekt.end_date,
                projekt.status
            )
        )
        
        row = cursor.fetchone()
        conn.commit()
        
        columns = [desc[0] for desc in cursor.description]
        new_project = dict(zip(columns, row))
        
        # Convert dates to ISO format
        if new_project.get('start_date'):
            new_project['start_date'] = new_project['start_date'].isoformat()
        if new_project.get('end_date'):
            new_project['end_date'] = new_project['end_date'].isoformat()
        if new_project.get('created_at'):
            new_project['created_at'] = new_project['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return new_project
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.put("/{projekt_id}")
async def update_bauprojekt(projekt_id: int, projekt: BauprojektUpdate):
    """Update a construction project (Admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build dynamic update query based on provided fields
        update_fields = []
        values = []
        
        if projekt.name is not None:
            update_fields.append("name = %s")
            values.append(projekt.name)
        if projekt.description is not None:
            update_fields.append("description = %s")
            values.append(projekt.description)
        if projekt.location is not None:
            update_fields.append("location = %s")
            values.append(projekt.location)
        if projekt.start_date is not None:
            update_fields.append("start_date = %s")
            values.append(projekt.start_date)
        if projekt.end_date is not None:
            update_fields.append("end_date = %s")
            values.append(projekt.end_date)
        if projekt.status is not None:
            update_fields.append("status = %s")
            values.append(projekt.status)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(projekt_id)
        
        query = f"""
            UPDATE bauprojekte
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, name, description, location, start_date, end_date, status, updated_at
        """
        
        cursor.execute(query, values)
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        conn.commit()
        
        columns = [desc[0] for desc in cursor.description]
        updated_project = dict(zip(columns, row))
        
        # Convert dates to ISO format
        if updated_project.get('start_date'):
            updated_project['start_date'] = updated_project['start_date'].isoformat()
        if updated_project.get('end_date'):
            updated_project['end_date'] = updated_project['end_date'].isoformat()
        if updated_project.get('updated_at'):
            updated_project['updated_at'] = updated_project['updated_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return updated_project
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/{projekt_id}")
async def delete_bauprojekt(projekt_id: int):
    """Delete a construction project (Admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM bauprojekte WHERE id = %s RETURNING id", (projekt_id,))
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "Project deleted successfully", "id": row[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )
