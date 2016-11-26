from channels import Group
from channels.sessions import channel_session
from main.models import ChatRoom
import json

def get_chat_room(label):
    try:
        room = ChatRoom.objects.get(label=label)
        return room
    except:
        room = ChatRoom(label=label)
        room.save()
        return room

@channel_session
def ws_connect(message):
    print message
    print message['path']
    try:
        prefix, label = message['path'].strip('/').split('/')
        if prefix == 'chat':
            room = get_chat_room(label)
            Group('chat-' + label).add(message.reply_channel)
            message.channel_session['room'] = room.label
    except Exception as e:
        print str(e)

@channel_session
def ws_receive(message):
    label = message.channel_session['room']
    room = ChatRoom.objects.get(label=label)
    data = json.loads(message['text'])
    Group('chat-'+label).send({'text': json.dumps(data)})

@channel_session
def ws_disconnect(message):
    label = message.channel_session['room']
    Group('chat-'+label).discard(message.reply_channel)