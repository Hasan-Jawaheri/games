# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-10-26 17:48
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Board',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cur_player', models.IntegerField()),
                ('is_over', models.IntegerField()),
                ('session_key', models.CharField(max_length=100, unique=True)),
                ('state', models.CharField(max_length=10000)),
                ('is_opened', models.CharField(max_length=10000)),
            ],
        ),
        migrations.CreateModel(
            name='ChatText',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=1000)),
                ('username', models.CharField(max_length=100)),
                ('tag', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=100)),
                ('board', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='sweeper.Board')),
            ],
        ),
        migrations.AddField(
            model_name='chattext',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='sweeper.Player'),
        ),
    ]
