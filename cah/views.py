from django.shortcuts import render, HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import random, string, json
from cah.models import *
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from channels import Group

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
        set = -1
        num_initial_cards = 10
    except:
        return HttpResponse("Failed")

    session_key = ""
    for i in range(0, 20):
        session_key += random.choice(string.ascii_letters)

    _white_cards = list(WhiteCard.objects.filter(set=set))
    if set == -1:
        _white_cards = list(WhiteCard.objects.all())
    black_cards = list(BlackCard.objects.filter(set=set))
    if set == -1:
        black_cards = list(BlackCard.objects.all())

    random.shuffle(_white_cards)
    random.shuffle(black_cards)

    cur_card = black_cards[0].text
    takes = black_cards[0].pick
    black_cards = black_cards[1:]
    white_cards = _white_cards[num_initial_cards:]

    white_cards = json.dumps(map(lambda c: c.id, white_cards))
    black_cards = json.dumps(map(lambda c: c.id, black_cards))
    b = Board(session_key=session_key, white_card_pool=white_cards, black_card_pool=black_cards, cur_card=cur_card, takes=takes)
    b.save()

    p = Player(username=name, board=b, cards=json.dumps(map( lambda c: {"id": c.id, "text": c.text}, _white_cards[:num_initial_cards])))
    p.save()

    return HttpResponse(reverse("cah")+"?session="+b.session_key + "&pid=" + str(p.id))

def join_game(r):
    try:
        name = r.GET["name"]
        session = r.GET["session"]
        b = Board.objects.get(session_key=session)
    except:
        return HttpResponse("Failed")

    whites = json.loads(b.white_card_pool)
    num_served = min(10, len(whites))
    cards = whites[:num_served]
    whites = whites[num_served:]
    b.white_card_pool = json.dumps(whites)
    b.save()

    if (num_served > 0):
        query = Q(id=cards[0])
        if num_served > 1:
            for w in cards[1:]:
                query |= Q(id=w)
        cards = list(WhiteCard.objects.filter(query))

    p = Player(username=name, board=b, cards=json.dumps(map( lambda c: {"id": c.id, "text": c.text}, cards)))
    p.save()

    return HttpResponse(reverse("cah")+"?session="+b.session_key + "&pid=" + str(p.id))

def board_state(r):
    try:
        pid = r.GET["pid"]
        player = Player.objects.get(id=pid)
        board = player.board
    except Exception as e:
        return HttpResponse(json.dumps({"status": "Invalid player ID"}))

    players = Player.objects.filter(board=board).order_by("id")
    if len(players) <= board.cur_judge:
        board.cur_judge = 0

    im_judge = players[board.cur_judge] == player

    print map(lambda p: {
        "name": p.username,
        "score": p.score,
        "locked": json.loads(p.current_play) if im_judge else (len(json.loads(p.current_play))),
    }, players)
    return HttpResponse(json.dumps({
        "status": "ok",
        "players": map(lambda p: {
            "name": p.username,
            "score": p.score,
            "locked": json.loads(p.current_play) if im_judge else (len(json.loads(p.current_play))),
        }, players),
        "you": player.username,
        "judge": board.cur_judge,
        "hand": json.loads(player.cards),
        "black_card": board.cur_card,
        "takes": board.takes,
    }))

def submit_play(r):
    try:
        pid = r.GET["pid"]
        play = json.loads(r.GET["play"])
        player = Player.objects.get(id=pid)
        board = player.board
    except Exception as e:
        return HttpResponse(json.dumps({"status": "Invalid player ID"}))

    player_cards = json.loads(player.cards)
    play_extended = []
    for card in play:
        player_copy = None
        for c in player_cards:
            if c["id"] == card:
                player_copy = c
        if player_copy == None:
            return HttpResponse(json.dumps({"status": "Illegal play"}))
        else:
            player_cards.remove(player_copy)
            play_extended.append(player_copy)
    if len(play_extended) != board.takes:
        return HttpResponse(json.dumps({"status": "Illegal play"}))

    player.cards = json.dumps(player_cards)
    player.current_play = json.dumps(play_extended)
    player.save()

    Group('game-'+board.session_key).send({'text': "state"})
    return HttpResponse(json.dumps({"status": "mmkay"}))

def select_winner(r):
    try:
        pid = r.GET["pid"]
        winner_name = r.GET["winner"]
        player = Player.objects.get(id=pid)
        board = player.board
    except Exception as e:
        return HttpResponse(json.dumps({"status": "Invalid player ID"}))

    players = Player.objects.filter(board=board).order_by("id")
    if board.cur_judge >= len(players):
        return HttpResponse(json.dumps({"status": "Invalid board"}))
    if players[board.cur_judge] != player:
        return HttpResponse(json.dumps({"status": "You're not the judge bro"}))
    winner = None
    for p in players:
        if p != player:
            if winner_name == p.username:
                winner = p
    if winner == None:
        return HttpResponse(json.dumps({"status": "who?"}))

    white_cards = json.loads(board.white_card_pool)
    black_cards = json.loads(board.black_card_pool)
    num_needed_cards = (len(players)-1) * board.takes
    cards_to_serve = None

    if num_needed_cards <= len(white_cards):
        card_ids_to_get = white_cards[:num_needed_cards]
        white_cards = white_cards[num_needed_cards:]
        query = Q(id=card_ids_to_get[0])
        for id in card_ids_to_get[1:]:
            query |= Q(id=id)
        cards_to_serve = map(lambda c: {"id": c.id, "text": c.text}, list(WhiteCard.objects.filter(query)))

    for p in players:
        if p != player:
            p.current_play = "[]"
            if p == winner:
                p.score += 1
            if cards_to_serve != None:
                new_cards = cards_to_serve[:board.takes]
                cards_to_serve = cards_to_serve[board.takes:]
                p.cards = json.dumps(json.loads(p.cards)+new_cards)
            p.save()

    if len(black_cards) == 0 or len(white_cards) < num_needed_cards:
        board.cur_card = ""
    else:
        black_card = BlackCard.objects.get(id=black_cards[0])
        board.cur_card = black_card.text
        board.takes = black_card.pick
        board.black_card_pool = json.dumps(black_cards[1:])
        board.cur_judge = ((board.cur_judge + 1) % len(players))

    board.white_card_pool = json.dumps(white_cards)
    board.black_card_pool = json.dumps(black_cards)
    board.save()

    Group('game-'+board.session_key).send({'text': "state"})
    return HttpResponse(json.dumps({"status": "mmkay"}))

@csrf_exempt
def populate_cards(r):
    try:
        print "OK!"
        pw = r.POST["password"]
        data = json.loads(r.POST["data"])
        if pw != "layoolty":
            return HttpResponse("Nop")
    except:
        return HttpResponse("Nop")

    Set.objects.all().delete()
    bcards = []
    wcards = []
    id = 1
    for k in data.keys():
        if k != "blackCards" and k != "whiteCards" and k != "order":
            s = Set(name=data[k]["name"])
            s.save()
            for bc in data[k]["black"]:
                bcards.append(BlackCard(id=id, text=data["blackCards"][bc]["text"], pick=data["blackCards"][bc]["pick"], set=s))
                id += 1
            for wc in data[k]["white"]:
                wcards.append(WhiteCard(id=id, text=data["whiteCards"][wc], set=s))
                id += 1
    BlackCard.objects.bulk_create(bcards)
    WhiteCard.objects.bulk_create(wcards)

    return HttpResponse("Love her!")
