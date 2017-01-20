from __future__ import unicode_literals

from django.db import models

class Player(models.Model):
    username = models.CharField(max_length=100)

class Board(models.Model):
    session_key = models.CharField(max_length=100, unique=True)
    cur_judge = models.IntegerField(default=0)
