const express = require('express');
const app = express();
const fetch = require('node-fetch');
require('dotenv').config();

const google_clientid = "848723162049-vq13mmv51p2n0hdscdje9t10vt7g45f8.apps.googleusercontent.com";
const google_clientsecret = "rutWhr6_eig1vVNRuh5HF7eD";

const google_redirect_uri = "http%3A//localhost:5000/oauth-callback";
const github_redirect_uri ="http://localhost:5000/github-callback";
const google_scope = 'profile';

//Listen on port 5002 and link HTML file to folder 'public'
app.listen(5000, () => console.log("Listening on port 5000"));
app.use(express.static('site'));


app.get("/", (req, res) => {
    res.send("hi");
})

//Google OAuth
//Small bug with Google's end. Google will not accept the redirect, but they accept it if you manually paste the request into your browser, which is why its console logged.
app.get("/signin-google", (req, res) => {
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?
    scope=${google_scope}&
    access_type=offline&
    response_type=code&
    redirect_uri=${google_redirect_uri}&
    client_id=${google_clientid}`)
    console.log(`https://accounts.google.com/o/oauth2/v2/auth?
    scope=${google_scope}&
    access_type=offline&
    response_type=code&
    redirect_uri=${google_redirect_uri}&
    client_id=${google_clientid}`)
})


app.get("/oauth-callback", async (req, res) => {
    const access_token = await getGoogleAccess(req.query.code)
    const data = await getGoogleAPI(access_token)
    res.send(data)

})


async function getGoogleAccess(auth_code) {
    const auth = auth_code
    let callback = "http://localhost:5000/oauth-callback"
    let gtype = "authorization_code"
    const request = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            'code':auth,
            'client_id':google_clientid,
            'client_secret':google_clientsecret,
            'redirect_uri':callback,
            'grant_type':gtype
        })
    });
    const text = await request.json();
    const params = new URLSearchParams(text);
    return params.get("access_token")
}

async function getGoogleAPI(access_token) {
    const request = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
        method: "GET",
        headers: {
            Authorization: "Bearer " + access_token
        }
    })
    const data = await request.json()
    console.log(data)
    return data
}


//Github OAuth ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

app.get("/signin-github", (req, res) => {
    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`
    );
});

async function getAccessCode(link, code, client_id, client_secret) {
    const request = await fetch(link, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        client_id,
        client_secret,
        code
        })
    });
    const text = await request.text();
    const params = new URLSearchParams(text);
    return params.get("access_token");
}  

async function fetchUser(link, token) {
    const request = await fetch(link, {
        method: "GET",
        headers: {
        Authorization: "token " + token
        }
    });
    const text = await request.text()
    return text;
}

app.get("/github-callback", async (req, res) => {
    const auth_grant = req.query.code
    const gid = process.env.GITHUB_CLIENT_ID;
    const gs = process.env.GITHUB_CLIENT_SECRET;
    const git_link = "https://github.com/login/oauth/access_token"
    const git_api = "https://api.github.com/user"
    let x = {
        client_id: "Iv1.4a7a5644cc23968a",
        client_secret: "ee648fb223bb195b0ad4580f9070f5fac0fd4d85",
        code: auth_grant
    }
    const access_token = await getAccessCode(git_link, auth_grant, gid, gs)
    const user = await fetchUser(git_api, access_token)
    if (user) {
        res.send(user)
    }
});
    
app.get("/github-logged-in", (req, res) => {
    res.send(req.query.access_token)
})

app.get("/logout", (req, res) => {
    if (req.session) req.session = null;
    req.logout();
    res.redirect("/");
});
    
app.get("/github-unsuccessful-login", (req, res) => {
    res.send("Try again,");
});
