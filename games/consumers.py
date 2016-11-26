from channels import Group
from channels.sessions import channel_session
import json

@channel_session
def ws_connect(message):
    try:
        prefix, label = message['path'].strip('/').split('/')
        message.channel_session['room'] = label
        if prefix == 'chat':
            Group('chat-' + label).add(message.reply_channel)
        elif prefix == 'game':
            Group('game-' + label).add(message.reply_channel)
    except Exception as e:
        print str(e)

@channel_session
def ws_receive(message):
    label = message.channel_session['room']
    data = json.loads(message['text'])
    Group('chat-'+label).send({'text': json.dumps(data)})

@channel_session
def ws_disconnect(message):
    label = message.channel_session['room']
    try:
        Group('chat-'+label).discard(message.reply_channel)
    except: pass
    try:
        Group('game-'+label).discard(message.reply_channel)
    except: pass
