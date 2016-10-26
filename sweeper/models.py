from django.db import models

# Create your models here.

class Board(models.Model):
  cur_player = models.IntegerField()
  is_over = models.IntegerField()
  session_key = models.CharField(max_length=100, unique=True)
  state = models.CharField(max_length=10000)
  is_opened = models.CharField(max_length=10000)

class Player(models.Model):
  board = models.ForeignKey(Board)
  username = models.CharField(max_length=100)

class ChatText(models.Model):
  text = models.CharField(max_length=1000)
  user = models.ForeignKey(Player)
  username = models.CharField(max_length=100)
  tag = models.IntegerField()
