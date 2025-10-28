from typing import List, Optional
from datetime import date, timedelta
from ..models.cycle import CycleCreate, CycleUpdate, CycleInDB
from ..core.database import db
from ..core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

class CycleService:
    @staticmethod
    async def create_cycle(cycle: CycleCreate, user_id: str) -> dict:
        cycle_data = cycle.dict()
        cycle_data["user_id"] = user_id
        cycle_data["created_at"] = date.today()
        cycle_data["updated_at"] = date.today()
        
        # Add to database
        doc_ref = db.collection("cycles").document()
        await doc_ref.set(cycle_data)
        
        return {"id": doc_ref.id, **cycle_data}

    @staticmethod
    async def get_user_cycles(user_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        cycles_ref = db.collection("cycles").where("user_id", "==", user_id)
        docs = await cycles_ref.order_by("start_date", "DESCENDING").offset(skip).limit(limit).get()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]

    @staticmethod
    async def get_current_cycle(user_id: str) -> Optional[dict]:
        today = date.today()
        cycles_ref = db.collection("cycles").where("user_id", "==", user_id)
        query = cycles_ref.where("start_date", "<=", today).order_by("start_date", "DESCENDING").limit(1)
        docs = await query.get()
        
        if not docs:
            return None
            
        current_cycle = docs[0].to_dict()
        current_cycle["id"] = docs[0].id
        
        # If the cycle is older than 10 days, it's probably not current
        if (today - current_cycle["start_date"]).days > 10:
            return None
            
        return current_cycle

    @staticmethod
    async def update_cycle(cycle_id: str, cycle: CycleUpdate, user_id: str) -> Optional[dict]:
        doc_ref = db.collection("cycles").document(cycle_id)
        doc = await doc_ref.get()
        
        if not doc.exists or doc.to_dict()["user_id"] != user_id:
            return None
            
        update_data = {k: v for k, v in cycle.dict().items() if v is not None}
        update_data["updated_at"] = date.today()
        
        await doc_ref.update(update_data)
        updated_doc = await doc_ref.get()
        return {"id": updated_doc.id, **updated_doc.to_dict()}

    @staticmethod
    async def delete_cycle(cycle_id: str, user_id: str) -> bool:
        doc_ref = db.collection("cycles").document(cycle_id)
        doc = await doc_ref.get()
        
        if not doc.exists or doc.to_dict()["user_id"] != user_id:
            return False
            
        await doc_ref.delete()
        return True