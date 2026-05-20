import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Project

def populate_users():
    # Ensure there is a project
    project, _ = Project.objects.get_or_create(project_name="Main Project")

    sample_users = [
        {'name': 'Jane Doe', 'email': 'jane.doe@example.com', 'role': 'S'},
        {'name': 'John Smith', 'email': 'john.smith@example.com', 'role': 'S'},
        {'name': 'Alice Williams', 'email': 'alice.w@example.com', 'role': 'U'},
        {'name': 'Bob Johnson', 'email': 'bob.j@example.com', 'role': 'U'},
        {'name': 'Charlie Contractor', 'email': 'charlie.c@example.com', 'role': 'O'},
    ]

    for user_data in sample_users:
        User.objects.get_or_create(email=user_data['email'], defaults={'name': user_data['name'], 'role': user_data['role'], 'project': project})
    
    print("Sample users populated.")

if __name__ == "__main__":
    populate_users()
