from datetime import datetime , timezone

class Registration:
    def __init__(self, username, email, password_hash, first_name, last_name, role):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.registration_date = datetime.now(timezone.utc)
        self.status = "pending"    # Current status of the registration (e.g., "pending", "approved", "rejected")
        self.admin_comments = ""
        self.is_active = False
        self.role = role

    def json(self):
        return {
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "registration_date": self.registration_date.isoformat(),
            "status": self.status,
            "admin_comments": self.admin_comments,
            "is_active": self.is_active,
            "role": self.role
        }