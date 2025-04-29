from flask import Flask, render_template, request, redirect, session, flash
import Database_Connection as DB
import secrets 

app = Flask(__name__)
app.secret_key = secrets.token_hex()

# Main page
@app.route("/")
def index():
    if('username' in session):

        ## GET USER ROUTES
        user_routes = DB.get_routes_by_user(session['UID'])

        return render_template("index.html",user=session['username'], routes=user_routes)
    return render_template("index.html")

# Route Data Form
@app.route("/save", methods=["POST"])
def save_route():
    if request.method == 'POST':
        name = request.form['routeName']
        data = request.form['routeData']
        if(data == ""):
            flash("No route to save", "saveMessage")
            return redirect('/')
        DB.add_route(session['UID'],name,data)
        flash(f"Route saved: {name}", "saveMessage")
    return redirect('/')

# Login Data Form
@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == 'POST':

        user = DB.authenticate_user(request.form["uName"], request.form["pWord"])

        if user:
            session['username'] = user[1]
            session['UID'] = user[0]
        else:
            flash("Username or password incorrect.", "logError")


    return redirect('/')

# Registration Form
@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == 'POST':
        
        username = request.form["uName"]
        password = request.form["pWord"]
        repeat_password = request.form["pWord2"]

        # -- Input validation --
        if(not username or not password):
            flash("Username/Password cannot be blank", "regError")
            return redirect('/')
        # Checking username
        if(not DB.check_user_available(username)):
            flash("Username taken.", "regError")
            return redirect('/')
        # Checking passwords match
        if(password != repeat_password):
            flash("Passwords do not match.", "regError")
            return redirect('/')
        
        error = DB.add_user(username, password)
        if(error):
            flash(f"Could not connect to db: {error}", "regError")
        
    return redirect('/')

@app.route("/logout")
def logout():
    session.pop("username", None)
    session.pop("UID", None)
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)