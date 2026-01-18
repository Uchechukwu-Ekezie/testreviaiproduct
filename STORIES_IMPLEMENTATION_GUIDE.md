# Stories Feature Implementation Guide

## Overview
This document describes the implementation of the Stories feature for the Revi backend. Stories allow users to post ephemeral content (text, images, video) that is visible for a limited time, similar to Instagram or WhatsApp stories.

## Models
- **Story**: Represents a single story post.
  - Fields: `id`, `user_id`, `media_url`, `caption`, `created_at`, `expires_at`, `is_active`, etc.
- **StoryView**: Tracks which users have viewed a story.
  - Fields: `id`, `story_id`, `viewer_id`, `viewed_at`
check for story seen by users
## API Endpoints
- `POST /stories/` — Create a new story
- `GET /stories/` — List active stories for all users
- `GET /stories/{user_id}` — List active stories for a specific user
- `POST /stories/{story_id}/view` — Mark a story as viewed by the current user
- `DELETE /stories/{story_id}` — Delete a story (owner only)

## Permissions
- Only authenticated users can create, view, or delete their stories.
- Users can only delete their own stories.

## Expiry Logic
- Stories expire after a set duration (e.g., 24 hours).
- Expired stories are automatically marked inactive and excluded from listings.

## Implementation Steps
1. **Model Creation**
   - Define SQLAlchemy models for `Story` and `StoryView`
2. **Schema Definition**
   - Create Pydantic schemas for story creation, response, and view tracking.
3. **Repository Layer**
   - Implement repository methods for CRUD operations and view tracking.
4. **Routes**
   - Add FastAPI routes for story creation, listing, viewing, and deletion.
5. **Background Task**
   - Optionally, implement a periodic task to clean up expired stories.
6. **Testing**
   - Write unit and integration tests for all endpoints and expiry logic.

## Example Story Model
```python
class Story(Base):
    __tablename__ = "stories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("customAuth_customusers.id"), nullable=False)
    media_url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
```

## Example Endpoints
```python
@router.post("/stories/", ...)
def create_story(...):
    # ...

@router.get("/stories/", ...)
def list_stories(...):
    # ...

@router.delete("/stories/{story_id}", ...)
def delete_story(...):
    # ...
```

## Notes
- Media uploads should be handled via a secure storage service (e.g., S3, Cloudinary).
- Consider rate limiting and abuse prevention for story posting.
- Add analytics for story views if needed.

---
For further details, see the code in `fastapi_app/api/routes/stories.py` and related models/schemas.
