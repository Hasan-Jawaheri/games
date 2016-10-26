from django.shortcuts import render, HttpResponse

# Create your views here.
def index(r):
  return render(r, 'main/index.html', {})