from __future__ import unicode_literals

from django.db import models

class Board(models.Model):
    session_key = models.CharField(max_length=100, unique=True)
    cur_judge = models.IntegerField(default=0)
    black_card_pool = models.TextField(default="[]")
    white_card_pool = models.TextField(default="[]")
    cur_card = models.CharField(max_length=300, default="")
    takes = models.IntegerField()

class Player(models.Model):
    username = models.CharField(max_length=100)
    score = models.IntegerField(default=0)
    board = models.ForeignKey(Board, null=True, default=None)
    cards = models.TextField(default="[]")
    current_play = models.TextField(default="[]")

class Set(models.Model):
    name = models.CharField(max_length=100)

class BlackCard(models.Model):
    text = models.CharField(max_length=300)
    pick = models.IntegerField()
    set = models.ForeignKey(Set)

class WhiteCard(models.Model):
    text = models.CharField(max_length=300)
    set = models.ForeignKey(Set)
