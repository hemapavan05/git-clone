
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const otpStore = new Map();

app.use(express.json());
app.use("/posters", express.static(path.join(__dirname, "posters")));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// FRONTEND: Complete one-page MovieBook website
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MovieBook - Movie Ticket Booking</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#101018;color:white;font-family:Arial,sans-serif}
header{background:#20202d;padding:18px 5%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
h1{color:#ff4757;margin:0}
main{max-width:1100px;margin:auto;padding:20px}
section{background:#20202d;padding:20px;border-radius:12px;margin:20px 0}
input,select{padding:12px;margin:8px 0 14px;width:100%;background:#30303d;color:white;border:1px solid #555;border-radius:5px}
button{padding:11px 16px;background:#ff4757;color:white;border:0;border-radius:5px;cursor:pointer;margin:5px 0}
button:hover{background:#e84118}
.movies{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px}
.movie{background:#30303d;padding:12px;border-radius:10px}
.poster{width:100%;height:270px;object-fit:cover;border-radius:8px;background:#444;display:block}
.movie h3{margin:12px 2px 4px}
.movie p,.small{color:#bbb;font-size:13px}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:15px}
.seats{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}
.seat{background:#555;padding:12px 2px;text-align:center;cursor:pointer;border-radius:5px}
.seat.selected{background:#2ed573;color:#101018}
.seat.booked{background:#8b3030;cursor:not-allowed}
.hidden{display:none}
#authMessage,#message{color:#7bed9f}
.screen{background:#ddd;color:#222;text-align:center;padding:8px;margin:15px 0 25px;border-radius:50%}
footer{text-align:center;padding:20px;color:#aaa}
@media(max-width:500px){.poster{height:220px}.seats{gap:5px}.seat{padding:10px 1px}}
</style>
</head>
<body>
<header>
<h1>🎬 MovieBook</h1>
<div>
<button onclick="showAuth()">Sign Up / Sign In</button>
<button onclick="logout()">Logout</button>
</div>
</header>

<main>
<section>
<h2>Welcome to MovieBook 🍿</h2>
<p>Discover movies, select your theatre, choose seats and create a demo booking.</p>
<p id="status">Please verify your email before booking.</p>
</section>

<section id="auth">
<h2>Sign Up / Sign In</h2>
<p class="small">Enter your name and email to verify your email address.</p>
<label for="name">Your Name</label>
<input id="name" placeholder="Enter your name" autocomplete="name">
<label for="email">Email Address</label>
<input id="email" type="email" placeholder="you@example.com" autocomplete="email">
<button onclick="sendOTP()">Send Email OTP</button>
<label for="otp">6-Digit OTP</label>
<input id="otp" inputmode="numeric" maxlength="6" placeholder="Enter OTP">
<button onclick="verifyOTP()">Verify OTP</button>
<p id="authMessage"></p>
</section>

<section>
<h2>🎞️ Now Showing</h2>
<div class="movies" id="movies"></div>
</section>

<section id="booking">
<h2>🎟️ Book Your Tickets</h2>
<div class="row">
<div><label for="city">Select City</label>
<select id="city" onchange="updateTheatres()">
<option>Hyderabad</option>
<option>Vijayawada</option>
<option>Rajahmundry</option>
<option>Tadepalligudem</option>
<option>Visakhapatnam</option>
</select></div>
<div><label for="theatre">Theatre / Multiplex</label>
<select id="theatre"></select></div>
<div><label for="date">Show Date</label>
<input type="date" id="date"></div>
<div><label for="time">Show Time</label>
<select id="time">
<option>10:00 AM</option>
<option>1:30 PM</option>
<option>6:00 PM</option>
<option>9:30 PM</option>
</select></div>
</div>
<label for="movie">Select Movie</label>
<select id="movie"></select>
<h3>Choose Your Seats — ₹180 per seat</h3>
<div class="screen">SCREEN THIS WAY</div>
<div class="seats" id="seats"></div>
<p>Selected Seats: <strong id="selected">None</strong></p>
<h3>Total: ₹<span id="total">0</span></h3>
<button onclick="book()">Continue to Payment</button>
</section>

<section id="payment" class="hidden">
<h2>💳 Demo Payment</h2>
<p id="summary"></p>
<p class="small">This is a demo. No money will be collected.</p>
<label for="method">Payment Method</label>
<select id="method">
<option>UPI Demo</option>
<option>Credit / Debit Card Demo</option>
<option>Net Banking Demo</option>
</select>
<button onclick="confirmBooking()">Confirm Demo Booking</button>
</section>

<section id="ticket" class="hidden">
<h2>✅ Booking Confirmation</h2>
<div id="ticketDetails"></div>
<button onclick="window.print()">Print Ticket</button>
</section>

<p id="message"></p>
</main>
<footer>MovieBook © 2026 | Movie ticket booking demo</footer>

<script>
const movieList = [
{name:"Toxic",poster:"toxic.jfif"},
{name:"Tellakagitam",poster:"tellakagitam.jfif"},
{name:"The Paradise",poster:"paradise.jfif"},
{name:"Irumudi",poster:"irumudi.jfif"},
{name:"Avengers",poster:null}
];

const theatreList = {
Hyderabad:["PVR Cinemas","INOX","AMB Cinemas"],
Vijayawada:["PVR Ripples","INOX LEPL Icon","Rama Theatre"],
Rajahmundry:["Syamala Theatre","Sri Suryamall"],
Tadepalligudem:["Venkatrama Theatre","Local Multiplex (Demo)","Lakshmi Narayana Theatre","Seshamahall Theatre"],
Visakhapatnam:["INOX Varun Beach","Cinepolis"]
};

let verifiedEmail = "";
let otpEmail = "";
let selectedSeats = [];
let chosenMovie = "Toxic";
let bookingInProgress = false;

function showAuth(){
 document.getElementById("auth").classList.remove("hidden");
 document.getElementById("auth").scrollIntoView({behavior:"smooth"});
}

function logout(){
 verifiedEmail = "";
 document.getElementById("status").textContent =
 "Please verify your email before booking.";
 document.getElementById("auth").classList.remove("hidden");
}

function renderMovies(){
 const container = document.getElementById("movies");
 container.innerHTML = "";

 movieList.forEach((m,i)=>{
  const article = document.createElement("article");
  article.className = "movie";

  if(m.poster){
   const img = document.createElement("img");
   img.className = "poster";
   img.src = "/posters/" + m.poster;
   img.alt = m.name + " poster";
   article.appendChild(img);
  }else{
   const placeholder = document.createElement("div");
   placeholder.className = "poster";
   placeholder.style.cssText =
    "display:grid;place-items:center;font-size:48px";
   placeholder.textContent = "🎬";
   article.appendChild(placeholder);
  }

  const title = document.createElement("h3");
  title.textContent = m.name;
  const description = document.createElement("p");
  description.textContent = "Movie ticket booking";
  const button = document.createElement("button");
  button.textContent = "Book This Movie";
  button.onclick = ()=>chooseMovie(i);

  article.append(title,description,button);
  container.appendChild(article);
 });

 const select = document.getElementById("movie");
 select.innerHTML = "";
 movieList.forEach((m,i)=>{
  const option = document.createElement("option");
  option.value = i;
  option.textContent = m.name;
  select.appendChild(option);
 });
 select.addEventListener("change",()=>{
  chosenMovie = movieList[Number(select.value)].name;
 });
}

function chooseMovie(index){
 chosenMovie = movieList[index].name;
 document.getElementById("movie").value = String(index);
 document.getElementById("booking").scrollIntoView({behavior:"smooth"});
}

function updateTheatres(){
 const city = document.getElementById("city").value;
 const theatre = document.getElementById("theatre");
 theatre.innerHTML = "";

 theatreList[city].forEach(name=>{
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  theatre.appendChild(option);
 });
}

function renderSeats(){
 const box = document.getElementById("seats");
 box.innerHTML = "";

 for(let i=1;i<=40;i++){
  const seat = document.createElement("button");
  seat.type = "button";
  seat.className = "seat";
  seat.textContent = i;
  seat.setAttribute("aria-label","Seat "+i);

  seat.onclick = ()=>{
   if(seat.classList.contains("selected")){
    seat.classList.remove("selected");
    selectedSeats = selectedSeats.filter(x=>x!==i);
   }else{
    if(selectedSeats.length>=8){
     alert("Maximum 8 seats per booking.");
     return;
    }
    seat.classList.add("selected");
    selectedSeats.push(i);
   }

   document.getElementById("selected").textContent =
    selectedSeats.join(", ") || "None";
   document.getElementById("total").textContent =
    selectedSeats.length*180;
  };

  box.appendChild(seat);
 }
}

async function sendOTP(){
 const email = document.getElementById("email").value.trim();
 const name = document.getElementById("name").value.trim();
 const message = document.getElementById("authMessage");

 if(!name || !email){
  alert("Enter your name and email.");
  return;
 }

 message.textContent = "Sending OTP...";

 try{
  const response = await fetch("/api/send-otp",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({email})
  });
  const data = await response.json();
  message.textContent = data.message;

  if(response.ok) otpEmail = email.toLowerCase();
 }catch(error){
  message.textContent = "Cannot connect to server.";
 }
}

async function verifyOTP(){
 const email = document.getElementById("email").value.trim().toLowerCase();
 const otp = document.getElementById("otp").value.trim();
 const message = document.getElementById("authMessage");

 if(!otpEmail || email!==otpEmail){
  alert("Send an OTP to this email first.");
  return;
 }

 message.textContent = "Verifying OTP...";

 try{
  const response = await fetch("/api/verify-otp",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({email,otp})
  });
  const data = await response.json();
  message.textContent = data.message;

  if(response.ok){
   verifiedEmail = email;
   document.getElementById("status").textContent =
    "Verified email: "+email;
   document.getElementById("auth").classList.add("hidden");
  }
 }catch(error){
  message.textContent = "Cannot connect to server.";
 }
}

function book(){
 if(!verifiedEmail){
  alert("Verify your email first.");
  showAuth();
  return;
 }

 if(selectedSeats.length===0){
  alert("Please select at least one seat.");
  return;
 }

 const date = document.getElementById("date").value;
 const now = new Date();
 const today = now.getFullYear()+"-"+
  String(now.getMonth()+1).padStart(2,"0")+"-"+
  String(now.getDate()).padStart(2,"0");

 if(!date || date<today){
  alert("Select today or a future date.");
  return;
 }

 document.getElementById("summary").textContent =
  chosenMovie+" | "+document.getElementById("city").value+
  " | "+document.getElementById("theatre").value+
  " | "+date+" | "+document.getElementById("time").value+
  " | Seats: "+selectedSeats.join(", ")+
  " | Total ₹"+selectedSeats.length*180;

 document.getElementById("payment").classList.remove("hidden");
 document.getElementById("payment").scrollIntoView({behavior:"smooth"});
}

function confirmBooking(){
 if(!verifiedEmail || selectedSeats.length===0){
  alert("Please verify your email and select seats.");
  return;
 }

 if(bookingInProgress) return;
 bookingInProgress = true;

 const bookingId = "MB"+Date.now();
 const details = [
  ["Booking ID",bookingId],
  ["Movie",chosenMovie],
  ["City",document.getElementById("city").value],
  ["Theatre",document.getElementById("theatre").value],
  ["Date",document.getElementById("date").value],
  ["Time",document.getElementById("time").value],
  ["Seats",selectedSeats.join(", ")],
  ["Email",verifiedEmail],
  ["Total","₹"+selectedSeats.length*180],
  ["Payment","Demo only — no money charged"]
 ];

 const box = document.getElementById("ticketDetails");
 box.replaceChildren();

 details.forEach(([label,value])=>{
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = label+": ";
  p.append(strong,document.createTextNode(value));
  box.appendChild(p);
 });

 document.getElementById("ticket").classList.remove("hidden");
 document.getElementById("ticket").scrollIntoView({behavior:"smooth"});
 document.getElementById("message").textContent =
  "Demo confirmation created. No real theatre reservation was made.";

 bookingInProgress = false;
}

renderMovies();
updateTheatres();
renderSeats();

const now = new Date();
const today = now.getFullYear()+"-"+
 String(now.getMonth()+1).padStart(2,"0")+"-"+
 String(now.getDate()).padStart(2,"0");

document.getElementById("date").min = today;
document.getElementById("date").value = today;
</script>
</body>
</html>`);
});

// BACKEND: SEND EMAIL OTP
app.post("/api/send-otp", async (req,res)=>{
 const email = String(req.body.email||"").trim().toLowerCase();

 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
  return res.status(400).json({message:"Enter a valid email address."});
 }

 const previous = otpStore.get(email);
 if(previous && Date.now()-previous.sentAt<60000){
  return res.status(429).json({
   message:"Wait 60 seconds before requesting another OTP."
  });
 }

 const otp = crypto.randomInt(100000,1000000).toString();
 const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

 otpStore.set(email,{
  otpHash,
  sentAt:Date.now(),
  expiresAt:Date.now()+300000,
  attempts:0
 });

 try{
  await transporter.sendMail({
   from:process.env.EMAIL_USER,
   to:email,
   subject:"MovieBook Email Verification",
   text:"Your MovieBook OTP is "+otp+
    ". It expires in 5 minutes. Do not share it."
  });

  res.json({message:"OTP sent to your email."});
 }catch(error){
  otpStore.delete(email);
  console.error("Email error:",error.message);
  res.status(500).json({
   message:"Email failed. Check EMAIL_USER and EMAIL_PASS."
  });
 }
});

// BACKEND: VERIFY EMAIL OTP
app.post("/api/verify-otp",(req,res)=>{
 const email = String(req.body.email||"").trim().toLowerCase();
 const otp = String(req.body.otp||"").trim();
 const record = otpStore.get(email);

 if(!record || Date.now()>record.expiresAt){
  otpStore.delete(email);
  return res.status(400).json({
   message:"OTP expired or not requested. Send a new OTP."
  });
 }

 if(record.attempts>=5){
  otpStore.delete(email);
  return res.status(429).json({
   message:"Too many attempts. Request a new OTP."
  });
 }

 record.attempts++;

 const submittedHash = crypto.createHash("sha256")
  .update(otp).digest("hex");

 if(!/^\\d{6}$/.test(otp)||submittedHash!==record.otpHash){
  return res.status(400).json({message:"Incorrect OTP."});
 }

 otpStore.delete(email);
 res.json({message:"Email verified successfully."});
});

app.listen(PORT,()=>{
 console.log("MovieBook running at http://localhost:"+PORT);
});