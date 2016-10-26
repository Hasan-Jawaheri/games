from django.shortcuts import render, HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import random, string, json
from sweeper.models import *

def mine_count_around(board, x, y):
  count = 0
  if x > 0:
    if y > 0:
      count += int(board.state[(y-1)*20+(x-1)])
    count += int(board.state[(y)*20+(x-1)])
    if y < 19:
      count += int(board.state[(y+1)*20+(x-1)])
  if x < 19:
    if y > 0:
      count += int(board.state[(y-1)*20+(x+1)])
    count += int(board.state[(y)*20+(x+1)])
    if y < 19:
      count += int(board.state[(y+1)*20+(x+1)])
  if y > 0:
    count += int(board.state[(y-1)*20+(x)])
  if y < 19:
    count += int(board.state[(y+1)*20+(x)])
  return count

def expand_board(board, _x, _y):
  is_visited = [0] * len(board.state)
  new_board_opened = list(board.is_opened)
  queue = [(_x, _y)]
  while (len(queue)):
    (x, y) = queue[0]
    if (len(queue) == 1):
      queue = []
    else:
      queue = queue[1:]
    if is_visited[y*20+x] == 1:
      continue
    is_visited[y*20+x] = 1
    target = board.state[y*20+x]
    if target == "0": # not a bomb, open and expand it
      new_board_opened[y*20+x] = "1"
      if mine_count_around(board, x, y) > 0:
        continue
      if x > 0:
        if y > 0:
          queue += [(x-1, y-1)]
        queue += [(x-1, y)]
        if y < 19:
          queue += [(x-1, y+1)]
      if x < 19:
        if y > 0:
          queue += [(x+1, y-1)]
        queue += [(x+1, y)]
        if y < 19:
          queue += [(x+1, y+1)]
      if y > 0:
        queue += [(x, y-1)]
      if y < 19:
        queue += [(x, y+1)]
  board.is_opened = "".join(new_board_opened)
  board.save()

def get_board_state(board):
  state = ""
  for y in range(0, 20):
    for x in range(0, 20):
      if board.is_opened[y*20+x] == "0":
        state += "x"
        continue
      count = mine_count_around(board, x, y)
      state += str(count)
  return state

def index(r):
  try:
    session = r.GET["session"]
    playerid = r.GET["pid"]
    player = Player.objects.get(id=playerid)
    return render(r, 'sweeper/game.html', {"session": session, "player": player, "minesweeper_active": "active"})
  except Exception as e:
    print (str(e))
    return render(r, 'sweeper/index.html', {"minesweeper_active": "active"})

def new_game(r):
  try:
    name = r.GET["name"]
  except:
    return HttpResponse("Failed")

  b = Board()
  b.cur_player = 0
  b.is_over = -1
  b.session_key = ""
  for i in range(0, 20):
    b.session_key += random.choice(string.ascii_letters)
  bombs = 60
  boxes = [1] * bombs + [0] * (400-bombs)
  random.shuffle(boxes)
  openbox = 0
  while 1:
    openbox = int(random.randint(0, 400))
    print (openbox)
    if boxes[openbox] == 0:
      break
  for y in range(0, 20):
    for x in range(0, 20):
      b.state += str(boxes[y*20+x])
      if y*20+x == openbox:
        b.is_opened += "1"
      else:
        b.is_opened += "0"
  b.save()
  expand_board(b, openbox % 20, int(openbox / 20))

  p = Player()
  p.board = b
  p.username = name
  p.save()

  return HttpResponse( "/sweeper?session="+b.session_key + "&pid=" + str(p.id))


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

  return HttpResponse( "/sweeper?session="+b.session_key + "&pid=" + str(p.id))

def board_state(r):
  try:
    pid = r.GET["pid"]
    player = Player.objects.get(id=pid)
    board = player.board
    players = Player.objects.filter(board=board)
    myindex = -1
    for i in range(0, len(players)):
      if players[i] == player:
        myindex = i
    if myindex == -1:
      raise
    loser = ""
    if board.is_over > -1:
      loser = Player.objects.get(id=board.is_over).username
  except Exception as e:
    print (str(e))
    return HttpResponse("Failed")

  return HttpResponse(json.dumps({
      "turn": players[board.cur_player].username if myindex != board.cur_player else "",
      "board": get_board_state(board),
      "bombs": board.state if board.is_over > -1 else "",
      "loser": loser
    }))

def check_box(r):
  try:
    pid = r.GET["pid"]
    x = int(r.GET["x"])
    y = int(r.GET["y"])
    player = Player.objects.get(id=pid)
    board = player.board
    players = Player.objects.filter(board=board)
    myindex = -1
    for i in range(0, len(players)):
      if players[i] == player:
        myindex = i
    if myindex == -1:
      raise
  except Exception as e:
    print (str(e))
    return HttpResponse("Failed")

  if board.is_over > -1:
    return HttpResponse("Game over sadeeg")
  if board.cur_player != myindex:
    return HttpResponse("7abibi not ur turn")

  if board.is_opened[y*20+x] == "1":
    return HttpResponse("used box bro")

  tmp = list(board.is_opened)
  tmp[y*20+x] = "1"
  board.is_opened = "".join(tmp)
  board.cur_player = (board.cur_player + 1) % len(players)
  board.save()
  if board.state[y*20+x] == "1":
    # bomb!
    board.is_over = player.id
    board.save()
  else:
    # explore all neighboring
    expand_board(board, x, y)

  return HttpResponse("/" + str(board.state[y*20+x]))



