import bcrypt
password = "2H8'Z&sx@QW+X=v,dz[tnsv$F"
print(bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))
