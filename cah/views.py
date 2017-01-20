from django.shortcuts import render, HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import random, string, json
from cah.models import *

def index(r):
    try:
        session = r.GET["session"]
        playerid = r.GET["pid"]
        player = Player.objects.get(id=playerid)
        return render(r, 'cah/game.html', {"session": session, "player": player, "cah_active": "active"})
    except Exception as e:
        return render(r, "cah/index.html", {"cah_active": "active"})

def new_game(r):
    try:
        name = r.GET["name"]
    except:
        return HttpResponse("Failed")

    b = Board()
    b.session_key = ""
    for i in range(0, 20):
        b.session_key += random.choice(string.ascii_letters)
    b.save()

    p = Player(username=name)
    p.save()

    return HttpResponse(reverse("cah")+"?session="+b.session_key + "&pid=" + str(p.id))


def join_game(r):
    try:
        name = r.GET["name"]
        session = r.GET["session"]
        b = Board.objects.get(session_key=session)
    except:
        return HttpResponse("Failed")

    p = Player()
    p.board = b
    p.username = name
    p.save()

    return HttpResponse(reverse("cah")+"?session="+b.session_key + "&pid=" + str(p.id))
