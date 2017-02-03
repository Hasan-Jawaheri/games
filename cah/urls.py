"""minesweeper URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from cah import views

urlpatterns = [
    url(r'^$', views.index, name='cah'),
    url(r'^new_game', views.new_game, name='cah_new_game'),
    url(r'^join_game', views.join_game, name='cah_join_game'),
    url(r'^board_state', views.board_state, name='cah_board_state'),
    url(r'^submit_play', views.submit_play, name='cah_submit_play'),
    url(r'^select_winner', views.select_winner, name='cah_select_winner'),

    url(r'^populate_cards', views.populate_cards, name='cah_populate_cards'),
]
