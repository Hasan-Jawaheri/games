# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2017-02-02 17:30
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cah', '0005_player_board'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlackCards',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=300)),
                ('pick', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Set',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='WhiteCard',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=300)),
                ('set', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cah.Set')),
            ],
        ),
        migrations.AlterField(
            model_name='board',
            name='cur_card',
            field=models.CharField(default='', max_length=300),
        ),
        migrations.AddField(
            model_name='blackcards',
            name='set',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cah.Set'),
        ),
    ]