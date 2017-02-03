#!/usr/bin/python

import requests, sys, json
from unidecode import *

try:
    url = sys.argv[1]
except:
    print "Usage:"
    print sys.argv[0] + " <url>"
    print "url: The URL to the tool to populate (www.tool.com/cah)."
    sys.exit(0)

s = requests.Session()
with open("cards.json", "r") as file:
    data_file = file.read()
    resp = s.post(url + "/populate_cards", data={"password": "layoolty", "data": data_file})
    print resp.text
