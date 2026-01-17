"""
In-memory storage for test sessions
Replaces SQLite database for serverless/stateless deployment
"""
from typing import Dict, Optional
from datetime import datetime
from app.models.test_session import Level, Phase, SessionStatus


class InMemoryStorage:
    """Simple in-memory storage for test sessions"""
    
    def __init__(self):
        self.sessions: Dict[int, Dict] = {}
        self._next_id = 1
    
    def create_session(self, level: Level) -> Dict:
        """Create a new test session"""
        session_id = self._next_id
        self._next_id += 1
        
        session = {
            "id": session_id,
            "level": level,
            "selected_phase": None,
            "status": SessionStatus.INITIALIZED,
            "phase1_content": None,
            "phase1_answers": None,
            "phase1_scores": None,
            "phase2_content": None,
            "phase2_answers": None,
            "phase2_scores": None,
            "final_results": None,
            "created_at": datetime.now(),
            "updated_at": None,
            "phase1_started_at": None,
            "phase1_completed_at": None,
            "phase2_started_at": None,
            "phase2_completed_at": None,
        }
        
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: int) -> Optional[Dict]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: int, **updates) -> Optional[Dict]:
        """Update session fields"""
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        for key, value in updates.items():
            if key in session:
                session[key] = value
        
        session["updated_at"] = datetime.now()
        return session
    
    def delete_session(self, session_id: int) -> bool:
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def get_all_sessions(self) -> list:
        """Get all sessions (for debugging)"""
        return list(self.sessions.values())


# Global storage instance
storage = InMemoryStorage()

