import time
#decorator

inputs = eval(input())
def logging_decortar(func):
    def wrapper(*args):
        func()
    return wrapper
    
