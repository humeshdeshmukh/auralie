from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from .base import BaseResponse

class CycleResponse(BaseResponse):
    data: Optional[dict] = None

class CycleListResponse(BaseResponse):
    data: List[dict] = []