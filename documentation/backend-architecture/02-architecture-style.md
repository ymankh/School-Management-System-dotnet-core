# Architecture Style

Use a **modular domain-based architecture**.

The structure should be:

* General
* Flexible
* Scalable
* Easy to extend
* Suitable for many school roles
* Suitable for many API endpoints
* Suitable for nested business domains
* Suitable for complex school workflows

The backend should be organized around **business modules**, not only around technical folders.

Examples of business modules:

```txt
Students
Teachers
Classes
Subjects
Exams
Attendance
Reports
Identity
Notifications
```

Avoid allowing folders like `DTOs/`, `Services/`, and `Helpers/` to become global dumping grounds as the backend grows.
