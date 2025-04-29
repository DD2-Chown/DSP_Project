import mysql.connector
from mysql.connector import errorcode
import hashlib

# DATABASE CONFIG
db_config = {
    'user': 'Dylan', 
    'password': 'Hb8agLo0',
    'host': '127.0.0.1',
    'database': 'runningdatabase'
}

def Connect_To_DB():
    """
    Creates a connection to the database
    
    Returns mysqlconnection and error
    """
    db = None
    error = None
    try:
        db = mysql.connector.connect(**db_config)
    except mysql.connector.Error as err:
        error = err
    return db, error

def add_user(username: str, password:str):
    """
    Adds a user to the database.
    
    Returns None on success and msql error if db connection failed.
    """
    database, error = Connect_To_DB()

    if(database and database.is_connected()):
        with database.cursor() as cursor:

            user_add = "INSERT INTO users (Username, Password) VALUES(%s,%s);"
            user_data = (username,hashlib.sha256(password.encode()).hexdigest())

            result = cursor.execute(user_add, user_data)
            
            database.commit()
            cursor.close()

        database.close()
        return None
    else:
        return error

def authenticate_user(username: str, password:str):
    """
    Checks username and password.

    Returns user if username and password correct (UID, Username)
    Returns None if db connection failed or username and password inccorect
    """
    database, error = Connect_To_DB()

    if(database and database.is_connected()):
        with database.cursor() as cursor:

            password_hash = hashlib.sha256(password.encode()).hexdigest()
            query = "SELECT UID, Username FROM users WHERE Username = %s AND Password = %s"

            result = cursor.execute(query, (username,password_hash))
            user = cursor.fetchone()

            return user
        
    else:
        print(error)
        return None

def check_user_available(username: str) -> bool:
    """
    Checks DB for existing username.

    Returns Bool
    """
    database, error = Connect_To_DB()

    if(database and database.is_connected()):
        with database.cursor() as cursor:

            query = "SELECT Username FROM users WHERE Username = %s"

            result = cursor.execute(query, (username,))
            user = cursor.fetchone()

            if user:
                return False
            return True

    else:
        print(error)
        return False

# TO DO
def delete_user(UID):
    database, error = Connect_To_DB()

# TO DO
def set_user_password(UID, newPass):
    pass



def add_route(userID: int, routeName:str, data):
    database, error = Connect_To_DB()
    if(database and database.is_connected()):
        with database.cursor() as cursor:

            route_add = "INSERT INTO routes (UID, RouteName, Route) VALUES(%s,%s,%s);"
            route_data = (userID,routeName,data)

            result = cursor.execute(route_add, route_data)
            # NEEDS ERROR HANDLING

            database.commit()
            cursor.close()

        database.close()
    else:
        # NEEDS ERROR HANDLING
        print(error)

def get_routes_by_user(userID: int):
    database, error = Connect_To_DB()

    routes = []

    if(database and database.is_connected()):
        with database.cursor() as cursor:
            
            query = "SELECT RouteID, RouteName, Route FROM routes WHERE UID = %s"

            result = cursor.execute(query, (userID,))
            routes = cursor.fetchall()

            cursor.close()

        database.close()
    else:
        # NEEDS ERROR HANDLING
        print(error)
    
    return routes

# TO DO
def get_route_data(RouteID):
    pass

# TO DO
def deleteRoute(RouteID):
    pass
