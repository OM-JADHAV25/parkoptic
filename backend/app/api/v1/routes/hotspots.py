"""
Hotspot API Routes.
"""

from fastapi import APIRouter, HTTPException

from app.repositories.hotspot_repository import (hotspot_repository,)

from app.schemas.hotspot import (HotspotDetails,MapHotspot)

router = APIRouter()


@router.get(
    "",
    response_model=list[MapHotspot],
    summary="Map Hotspots",
)
async def get_hotspots():

    return hotspot_repository.map_summary()


@router.get(
    "/{h3_index}",
    response_model=HotspotDetails,
    summary="Hotspot Details",
)
async def get_hotspot(
    h3_index: str,
):

    hotspot = hotspot_repository.get(h3_index)

    if hotspot is None:

        raise HTTPException(
            status_code=404,
            detail="Hotspot not found.",
        )

    return hotspot