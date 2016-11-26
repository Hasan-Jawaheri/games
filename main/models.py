from django.db import models

class ChatRoom(models.Model):
  label = models.CharField(max_length=100, unique=True)
