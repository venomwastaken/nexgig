from app.models import BookingStatus


def booking_created_copy(actor_name: str, gig_title: str) -> tuple[str, str]:
    return (
        "New booking request",
        f"{actor_name} requested a booking for '{gig_title}'.",
    )


def booking_status_copy(status: BookingStatus, actor_name: str, gig_title: str) -> tuple[str, str]:
    if status == BookingStatus.accepted:
        return (
            "Booking accepted",
            f"{actor_name} accepted your booking for '{gig_title}'.",
        )
    if status == BookingStatus.declined:
        return (
            "Booking declined",
            f"{actor_name} declined your booking for '{gig_title}'.",
        )
    if status == BookingStatus.completed:
        return (
            "Booking completed",
            f"{actor_name} marked your booking for '{gig_title}' as completed.",
        )
    if status == BookingStatus.cancelled:
        return (
            "Booking cancelled",
            f"{actor_name} cancelled your booking for '{gig_title}'.",
        )
    return (
        "Booking updated",
        f"{actor_name} updated your booking for '{gig_title}'.",
    )


def message_copy(actor_name: str, preview: str | None = None) -> tuple[str, str]:
    if preview:
        return (
            "New message",
            f"{actor_name}: {preview}",
        )
    return (
        "New message",
        f"{actor_name} sent you a message.",
    )
