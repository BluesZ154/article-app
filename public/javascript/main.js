const OutputTableAuth = document.querySelector('#output-area-auth');
const notifArea = document.querySelector('#notification');
const OutputArea = document.querySelector('#output-area');
const DetailOutputArea = document.querySelector('#OutputDetailArea');
const ProfileOutputArea = document.querySelector('#profile-output');
const EditProfileOutput = document.querySelector('#edit-profile-output');
const CollectionOutput = document.querySelector('#collection-output');
const BtnOuput = document.querySelector('#btn-output');
const AddFriendOutput = document.querySelector('#addFriend-output');
const AddFriendDetailArea = document.querySelector('#AddFriendDetailArea');
const NotifOutput =  document.querySelector('#notif-output');
const OTPoutput = document.querySelector("#otp-output");
const SendBtn = document.querySelector("#send-btn");
const otpCodeShow = document.querySelector("#otp-code-show")

// API URL auto detect
const API = location.hostname === "localhost"
  ? "http://localhost:4500"
  : "https://article-app-production.up.railway.app";

document.addEventListener('DOMContentLoaded', async (e) => {
  if (window.location.pathname !== '/OTPverification.html') {
    await CheckToken();
  }

  const registerForm = document.querySelector('#register-form');
  const loginForm = document.querySelector('#login-form');
  const uploadBtn = document.querySelector('#upload-button');
  const SubmitUpdateBtn = document.querySelector('#editprofile-form');
  const SearchBtn = document.querySelector('#search-button');
  const FollowBtn = document.querySelector('.follow-btn');
  const UnfollowBtn = document.querySelector('.unfollow-btn');
  const SearchArticleBtn = document.querySelector('#search-article-button');
  const ResendBtn = document.querySelector('#resend-btn');

  if(registerForm) registerForm.addEventListener('submit', Register);
  if(loginForm) loginForm.addEventListener('submit', Login);
  if(uploadBtn) uploadBtn.addEventListener('click', Upload);
  if(OutputArea && window.location.pathname === '/index.html') {
    ShowArticles();
  }
  if(window.location.pathname === '/profile.html') {
    ShowProfile();
  }
  if(SubmitUpdateBtn) SubmitUpdateBtn.addEventListener('submit', EditProfile);
  if(CollectionOutput && window.location.pathname === '/collection.html') {
    ShowCollection();
  }
  if (SearchArticleBtn) SearchArticleBtn.addEventListener('click', SearchArticle);
  if (SearchBtn) SearchBtn.addEventListener('click', SearchUser);
  if (AddFriendDetailArea && window.location.pathname === '/addFriendDetail.html') {
    ShowTargetUserDetail();
  }
  if (FollowBtn) FollowBtn.addEventListener('click', Follow);
  if (UnfollowBtn) UnfollowBtn.addEventListener('click', Unfollow);
  if (SendBtn) SendBtn.addEventListener('click', OTPverification);
  if (ResendBtn) ResendBtn.addEventListener('click', ResendEmail);
})

const Register = async (e) => {
  try {
    e.preventDefault();
    const form = e.target;
    const dataForm = new FormData(form);
    const username = dataForm.get('input-username');
    const email = dataForm.get('input-email');
    const password = dataForm.get('input-password');

    if (!username || !email || !password) throw new Error('Username, Email, Password is Required');

    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      }),
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Something Went Error: ${data.msg}`);

    OutputTableAuth.innerHTML = `
      <p>Account Created</p>
     `

    localStorage.setItem("otpEmail", email);

    window.location.href = "/OTPverification.html";

  } catch (error) {
    console.log(error);
    OutputTableAuth.innerHTML = 
       `
      <p>${error.message}</p>
      `;
      return;
  }
}

const Login = async (e) => {
  try {
    e.preventDefault();
    const form = e.target;
    const dataForm = new FormData(form);
    const email = dataForm.get('login-email');
    const password = dataForm.get('login-password');

    if (!email || !password) throw new Error(`Email and Password is Required`);

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
      credentials: "include"
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(`Something Wrong: ${data.msg}`);

    alert("Login Success");
    window.location.href = '/index.html';

  } catch (error) {
    console.log(error);
    OutputTableAuth.innerHTML = 
       `
      <p>${error.message}</p>
      `;
      return;
  }
}

const CheckToken = async () => {
  const currentPage = window.location.pathname;
  const pages = ['/register.html', '/login.html'];

  if (pages.some(page => currentPage.endsWith(page))) return;

  try {
    const res = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });

    if (!res.ok) throw new Error('Access Token Invalid');

  } catch (error) {
    const refreshRes = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });    

    if (!refreshRes.ok) {
      const logoutRes = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      if (!logoutRes.ok) console.log("LOGOUT Failed");

      window.location.href = '/register.html';
    }
  }
}

const Upload = async () => {
  try {
    const content = quill.root.innerHTML;
    const title = document.querySelector('#input-title').value;
    const tags = document.querySelector('#input-tags').value;
    if (!content || !title) throw new Error('All Data is Required');

    const res = await fetch(`${API}/api/article/upload`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title,
        content: content,
        tags: tags,
      }),
      credentials: "include"
    });

    if (!res.ok) {
      const respon = await res.json();
      notifArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    notifArea.innerHTML = 
        `<p>Upload Successful</p>`;
    return;        

  } catch (error) {
    console.log(error);
    notifArea.innerHTML = 
    `<p>${error.message}</p>`;
      return;
  }
}

const ShowArticles = async (e) => {
  try {
    const res = await fetch(`${API}/api/article/all`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      OutputArea.innerHTML = 
      `<p>Something Went Error</p>`;
        return;
    }

    const respon = await res.json();
    const articles = Array.isArray(respon.articles) ? respon.articles : [];

    if (articles.length === 0) {
      return OutputArea.innerHTML = "<p>Articles is Empty</p>"
    }

    OutputArea.innerHTML = articles.map(item => `
      <tr>
        <td id="post-${item._id}">
          <p class="article-title-btn" data-id=${item._id} style="color: black; font-size: 30px;"'>${item.title}</p>
          <p style="color: grey; font-size: 15px;">by: ${!item.author ? "-" : item.author?.username}</p>
          
          <br>
          <button class="like-btn" data-id="${item._id}">👍 
          <span class='like-count'>${item.likeCount}</span></button>
          <button class="dislike-btn" data-id="${item._id}">👎 
          <span class='dislike-count'>${item.dislikeCount}</span></button>
        </td>  
      </tr>
      `).join("");

    document.querySelectorAll('.article-title-btn').forEach(btn => {
      btn.addEventListener('click', OpenArticle);
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => LikeDislikeArticle(e, "like"));
    });

    document.querySelectorAll('.dislike-btn').forEach(btn => {
      btn.addEventListener('click', (e) => LikeDislikeArticle(e, "dislike"));
    });

    sessionStorage.setItem('prevPATH', window.location.pathname);

  } catch (error) {
    console.log(error);
    OutputArea.innerHTML = 
    `<p>${error.message}</p>`;
      return;
  }
}

const OpenArticle = async (e) => {
  const articleId = e.target.getAttribute('data-id');
  window.location.href = `/articleDetail.html?id=${articleId}`;
}

const ShowArticleDetails = async (e) => {
  try {
    const prevPATH = sessionStorage.getItem('prevPATH') || '/index.html';

    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId) throw new Error('Article Id Not Found');

    const res = await fetch(`${API}/api/article/id`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        articleId: articleId
      }),
      credentials: "include"
    });
    if (!res.ok) {
      const respon = await res.json();
      DetailOutputArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    const article = await res.json();

    console.log(prevPATH);
    BtnOuput.innerHTML = `
      <button id="gotoIndexPage" onclick="window.location.href='${prevPATH}'">Back</button>
    `;
    
    DetailOutputArea.innerHTML = 
    `
    <div id="pre-detail-container">
    <p id="article-title">Title: ${article.title}</p>
    <p id="article-author">Author: ${!article.author ? "-" : article.author?.username}</p>
    <p id="article-slug">Slug: ${article.slug}</p>
    <p id="article-tags">Tags: ${article.tags}</p>

    <div id="body-container">
      <p id="article-body">${article.body}</p>
    </div>
  </div>
    `;

  } catch (error) {
    console.log(error);
    DetailOutputArea.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

if (window.location.href.includes('articleDetail.html')) {
  document.addEventListener('DOMContentLoaded', ShowArticleDetails);
}

const ShowProfile = async () => {
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    });
    if (!decodeRes.ok) {
      const respon = await decodeRes.json();
      ProfileOutputArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const decode = await decodeRes.json();
    const id = decode.decode.id;

    const userRes = await fetch(`${API}/api/auth/id`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id
      }),
      credentials: "include"
    });
    if (!userRes.ok) {
      const respon = await userRes.json();
      ProfileOutputArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const user = await userRes.json();
    const joinedDate = new Date(user.createdAt);
    const joinedText = joinedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    ProfileOutputArea.innerHTML = `
      <div class="main-container">
        <div id="profile-username">Username: ${user.username}</div>
        <div id="profile-email">Email: ${user.email}</div>
        <div id="profile-follower">Follower: ${user.followersCount}</div>
        <div id="profile-following">Following: ${user.followingsCount}</div>
        <div id="profile-bio">Bio: ${user.bio}</div>    
      </div>

      <div class="more-container">
        <div id="profile-phonenumber">Phone Number: ${user.phonenumber}</div>
        <div id="profile-location">Location: ${user.location}</div>
        <div id="profile-age">Age: ${user.age}</div>
        <div id="profile-job">Job: ${user.job}</div>
        <div id="profile-skill">Skill: ${user.skill}</div>
        <div id="profile-joineddate">Joined At: ${joinedText}</div>
      </div>

      <div id="more-button">
        <button id="myarticle-btn" onclick="window.location.href='/collection.html'">MyArticle</button>
        <button id="logout-btn">Logout</button>
      </div>
    `;

    document.querySelector('#logout-btn')
    .addEventListener('click', UserLogout);

  } catch (error) {
    console.log(error);
    ProfileOutputArea.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const EditProfile = async (e) => {
  e.preventDefault();
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    });
    if (!decodeRes.ok) {
      const respon = await decodeRes.json();
      ProfileOutputArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const decode = await decodeRes.json();
    const id = decode.decode.id;

    const getRes = await fetch(`${API}/api/auth/id`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id
      }),
      credentials: "include"
    });
    if (!getRes.ok) {
      const respon = await getRes.json();
      EditProfileOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    const userData = await getRes.json();

    e.preventDefault();
    const form = e.target;
    const dataForm = new FormData(form);
    let bio = dataForm.get('new-profile-bio');
    let phonenumber = dataForm.get('new-profile-phonenumber');
    let location = dataForm.get('new-profile-location');
    let age = dataForm.get('new-profile-age');
    let job = dataForm.get('new-profile-job');
    let skill = dataForm.get('new-profile-skill');

    if (!bio) bio = userData.bio;
    if (!phonenumber) phonenumber = userData.phonenumber;
    if (!location) location = userData.location;
    if (!age) age = userData.age;
    if (!job) job = userData.job;
    if (!skill) skill = userData.skill;

    phonenumber = Number(phonenumber);
    age = Number(age);
    if (!(typeof bio === 'string' || bio === '-')) throw new Error('Bio Must Be Characters');
    if (isNaN(phonenumber) || !Number.isInteger(phonenumber)) throw new Error('Phonenumber Must Be Integer');
    if (!(typeof location === 'string' || location === '-')) throw new Error('Location Must Be Characters');
    if (isNaN(age) || !Number.isInteger(age)) throw new Error('Age Must Be Integer');
    if (!(typeof job === 'string' || job === '-')) throw new Error('Job Must Be Characters');
    if (!(typeof skill === 'string' || skill === '-')) throw new Error('Skill Must Be Characters');

    const updateRes = await fetch(`${API}/api/auth/update/id`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id,
        bio: bio,
        phonenumber: phonenumber,
        location: location,
        age: age,
        job: job,
        skill: skill
      }),
      credentials: "include"
    });
    if (!updateRes.ok) {
      const respon = await updateRes.json();
      EditProfileOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    EditProfileOutput.innerHTML = `
      <h3 id='updated-notification'>Profile Data Updated</h3>
    `;

  } catch (error) {
    console.log(error);
    EditProfileOutput.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
} 

const ShowCollection = async () => {
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    }); 
    if (!decodeRes.ok) {
      const respon = await decodeRes.json();
      CollectionOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const decode = await decodeRes.json();
    const userId = decode.decode.id;

    const articleRes = await fetch(`${API}/api/article/user`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId
      }),
      credentials: "include"
    });
   
    if (!decodeRes.ok) {
      const text = await decodeRes.text(); // ✅ aman
      console.log(text); // liat isi aslinya
      ProfileOutputArea.innerHTML = `<p>Something Went Wrong</p>`;
      return;
    }

    const userArticle = await articleRes.json();
    
    CollectionOutput.innerHTML = userArticle.map(item => `
      <tr>
        <td>
          <p class="article-title-btn" data-id=${item._id} style="color: black; font-size: 30px;"'>${item.title}</p>
          <p style="color: grey; font-size: 15px;">by: ${!item.author ? "-" : item.author?.username}</p>
          <br>
          <button class="delete-btn" data-id=${item._id}>Delete</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.article-title-btn').forEach(
      btn => btn.addEventListener('click', OpenArticle)
    );

    document.querySelectorAll('.delete-btn').forEach(
      btn => btn.addEventListener('click', DeleteArticle)
    );

    sessionStorage.setItem('prevPATH', window.location.pathname);

  } catch (error) {
    console.log(error);
    CollectionOutput.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const SearchArticle = async () => {
  try {
    const searchBy = document.querySelector('#search-by').value;
    const input = document.querySelector('#search-input').value;
    if (!input) throw new Error('Input is Empty');

    const searchRes = await fetch(`${API}/api/article/searchArticle`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: input,
        searchBy: searchBy
      }),
      credentials: "include"
    });
    if (!searchRes.ok) {
      const respon = await searchRes.json();
      OutputArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    const result = await searchRes.json();

    OutputArea.innerHTML = result.map(item => `
      <tr>
       <td id="post-${item._id}">
          <p class="article-title-btn" data-id=${item._id} style="color: black; font-size: 30px;"'>${item.title}</p>
          <p style="color: grey; font-size: 15px;">by: ${item.authorData.username}</p>
          
          <br>
          <button class="like-btn" data-id="${item._id}">👍 
          <span class='like-count'>${item.likeCount}</span></button>
          <button class="dislike-btn" data-id="${item._id}">👎 
          <span class='dislike-count'>${item.dislikeCount}</span></button>
        </td>  
      </tr>
    `).join('');

    document.querySelectorAll('.article-title-btn').forEach(
      btn => btn.addEventListener('click', OpenArticle)
    );

    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => LikeDislikeArticle(e, "like"));
    });

    document.querySelectorAll('.dislike-btn').forEach(btn => {
      btn.addEventListener('click', (e) => LikeDislikeArticle(e, "dislike"));
    });

  } catch (error) {
    console.log(error);
    OutputArea.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const OpenUserDetail = async (e) => {
  const TargetUserId = e.target.getAttribute('data-id');
  window.location.href = `addFriendDetail.html?targetId=${TargetUserId}`;
}

const SearchUser = async () => {
  try {
    const searchBy = document.querySelector('#search-by').value;
    let input = document.querySelector('#search-input').value;
    if (!input) throw new Error('Input is Empty');

    const searchRes = await fetch(`${API}/api/article/searchUser`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: String(input),
        searchBy: searchBy
      }),
      credentials: "include"
    });
    if (!searchRes.ok) {
      const respon = await searchRes.json();
      AddFriendOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    const result = await searchRes.json();

    AddFriendOutput.innerHTML = result.map(item => `
          <tr>
      <td style="
        border: none;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      " 
      onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 4px 10px rgba(0,0,0,0.15)';" 
      onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 6px rgba(0,0,0,0.08)';">

        <h3 class="target-username-btn" data-id=${item._id}
            style="
              margin: 0;
              font-size: 1.3rem;
              color: #222;
              cursor: pointer;
              display: inline-block;
            "
            onmouseover="this.style.color='#007bff'"
            onmouseout="this.style.color='#222'">
          ${item.username}
        </h3>

        <button class="follow-btn" data-id="${item._id}" style="
          margin-left: 12px;
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s ease;
        "
        onmouseover="this.style.background='#0056b3'"
        onmouseout="this.style.background='#007bff'">
          Follow
        </button>

        <p style="margin: 8px 0 4px 0; color: #444; font-size: 0.9rem;">
          📧 <strong>Email:</strong> ${item.email}
        </p>

        <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem;">
          🆔 <strong>ID:</strong> ${item._id}
        </p>

        <p style="
          background: #fff;
          border-left: 3px solid #007bff;
          padding: 10px;
          margin-top: 10px;
          border-radius: 6px;
          color: #333;
          font-size: 0.9rem;
        ">
          ${item.bio}
        </p>
      </td>
    </tr>

    `).join('');

    document.querySelectorAll('.target-username-btn').forEach(
      btn => btn.addEventListener('click', OpenUserDetail)
    );

    const FollowBtn = document.querySelector('.follow-btn');
    const UnfollowBtn = document.querySelector('.unfollow-btn');

    if (FollowBtn) {
      document.querySelectorAll('.follow-btn').forEach(
        btn => btn.addEventListener('click', Follow)
      );
    }
    else if (UnfollowBtn) {
      document.querySelectorAll('.unfollow-btn').forEach(
        btn => btn.addEventListener('click', Unfollow)
      );
    }

  } catch (error) {
    console.log(error);
    AddFriendOutput.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const ShowTargetUserDetail = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('targetId');
    if (!targetId) throw new Error('User ID Not Found');

    const res = await fetch(`${API}/api/auth/id`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: targetId
      }),
      credentials: "include"
    });
    if (!res.ok) {
      const respon = await res.json();
      AddFriendDetailArea.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    const user = await res.json();

    AddFriendDetailArea.innerHTML = `
      <div style="
        max-width:700px;
        margin:20px auto;
        background:#fff;
        border-radius:18px;
        padding:25px;
        box-shadow:0 8px 20px rgba(0,0,0,0.08);
        font-family:'Poppins',sans-serif;
        color:#333;
      ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:15px;
        ">
          <h2 style="
            font-size:1.6rem;
            font-weight:700;
            color:#1e3a8a;
            margin:0;
          ">${user.username}</h2>

          <button class="follow-btn" data-id="${user._id}" style="
            background:#2563eb;
            color:#fff;
            border:none;
            border-radius:8px;
            padding:8px 18px;
            font-weight:600;
            cursor:pointer;
            transition:background 0.2s ease,transform 0.1s ease;
          " onmouseover="this.style.background='#1d4ed8';this.style.transform='scale(1.05)'"
            onmouseout="this.style.background='#2563eb';this.style.transform='scale(1)'">
            Follow
          </button>
        </div>

        <div style="font-size:0.95rem;color:#555;margin-bottom:6px;">
          ${user.email}
        </div>
        <div style="font-size:0.9rem;color:#666;margin-bottom:4px;">
          Follower: ${user.follower}
        </div>
        <div style="font-size:0.9rem;color:#666;margin-bottom:10px;">
          Following: ${user.following}
        </div>

        <div style="
          font-size:1rem;
          color:#333;
          background:#f9f9f9;
          border-radius:10px;
          padding:12px 15px;
          line-height:1.6;
          margin-top:10px;
        ">
          ${user.bio}
        </div>
      </div>

      <div style="
        max-width:700px;
        margin:25px auto 0;
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
        gap:15px;
      ">
        <div style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          box-shadow:0 4px 15px rgba(0,0,0,0.05);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
          <b>Phone:</b> ${user.phonenumber}
        </div>

        <div style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          box-shadow:0 4px 15px rgba(0,0,0,0.05);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
          <b>Location:</b> ${user.location}
        </div>

        <div style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          box-shadow:0 4px 15px rgba(0,0,0,0.05);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
          <b>Age:</b> ${user.age}
        </div>

        <div style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          box-shadow:0 4px 15px rgba(0,0,0,0.05);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
          <b>Job:</b> ${user.job}
        </div>

        <div style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          box-shadow:0 4px 15px rgba(0,0,0,0.05);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
          <b>Skill:</b> ${user.skill}
        </div>
      </div>
    `

  } catch (error) {
    console.log(error);
    AddFriendDetailArea.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const Follow = async (e) => {
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    });
    if (!decodeRes.ok) {
      const respon = await decodeRes.json();
      NotifOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const decode = await decodeRes.json();

    const userId = decode.decode.id;
    const targetId = e.target.getAttribute('data-id');
    if (!userId) throw new Error('User ID not Found');
    if (!targetId) throw new Error('Target ID not Found');

    const res = await fetch(`${API}/api/auth/follow`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        targetId: targetId
      }),
      credentials: "include"
    });
    if (!res.ok) {
      const respon = await res.json();
      NotifOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    e.target.innerHTML = "Unfollow";
    e.target.className = "unfollow-btn";
    NotifOutput.innerHTML = "<p>Followed</p>";

  } catch (error) {
    console.log(error);
    NotifOutput.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const Unfollow = async (e) => {
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    });
    if (!decodeRes.ok) {
      const respon = await decodeRes.json();
      NotifOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    };

    const decode = await decodeRes.json();

    const userId = decode.decode.id;
    const targetId = e.target.getAttribute('data-id');
    if (!userId) throw new Error('User ID not Found');
    if (!targetId) throw new Error('Target ID not Found');

    const res = await fetch(`${API}/api/auth/unfollow`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        targetId: targetId
      }),
      credentials: "include"
    });
    if (!res.ok) {
      const respon = await res.json();
      NotifOutput.innerHTML = 
        `<p>Something Went Wrong: ${respon.msg}</p>`;
        return;
    }

    e.target.innerHTML = "Follow";
    e.target.className = "follow-btn";
    NotifOutput.innerHTML = "<p>Unfollowed<p>";

  } catch (error) {
    console.log(error);
    NotifOutput.innerHTML = 
    `<p>${error}</p>`;
      return;
  }
}

const LikeDislikeArticle = async (e, mode) => {
  try {
    const decodeRes = await fetch(`${API}/api/auth/verify`, {
      method: 'GET',
      credentials: "include"
    });

    const decode = await decodeRes.json();

    if (!decodeRes.ok) {
      console.log(decode.msg);
    };

    const userId = decode.decode.id;
    const targetArticleId = e.target.getAttribute('data-id');
    
    if (!userId) throw new Error('User ID not Found');
    if (!targetArticleId) throw new Error('Target ID not Found');

    const res = await fetch(`${API}/api/article/like-dislike`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        targetArticleId: targetArticleId,
        mode: mode
      }),
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      console.log(data.msg);
    }

    const postElement = document.querySelector(`#post-${targetArticleId}`);
    console.log(postElement)

    postElement.querySelector(".like-count").textContent = data.likeCount;
    postElement.querySelector(".dislike-count").textContent = data.dislikeCount;

    const likeBtn = postElement.querySelector('.like-btn');
    const dislikeBtn = postElement.querySelector('.dislike-btn');

    if (data.like.includes(userId)) {
      likeBtn.classList.add('active');
    }
    else {
      likeBtn.classList.remove('active')
    }

    if (data.dislike.includes(userId)) {
      dislikeBtn.classList.add('active');
    }
    else {
      dislikeBtn.classList.remove('active')
    }

  } catch (error) {
    console.log(error);
  }
}

const DeleteArticle = async (e) => {
  try {
    const id = e.target.getAttribute('data-id');
    if (!id) return console.log("No ID Provided");

    const res = await fetch(`${API}/api/article/delete`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id
      }),
      credentials: "include"
    });
    if (!res.ok) {
      const respon = await res.json();
      console.log(respon.msg);
    }

    ShowCollection(); 
    
  } catch (error) {
    console.log(error);
  }
}

const UserLogout = async () => {
  if (!confirm('Confirm To Logout?')) return;

  try {
    const logoutRes = await fetch(`${API}/api/auth/logout`, {
      method: 'GET',
      credentials: "include"
    })
    if (!logoutRes.ok) {
      console.log('Logout Failed');
    }

    const result = await logoutRes.json();

    alert(result.msg);
    window.location.href = "/login.html";

  } catch (error) {
    console.log(error);
  }
}

const OTPverification = async () => {
  const OTPoutput = document.querySelector('#otp-output');

  try {
    // Ambil data
    const otpEmail = localStorage.getItem("otpEmail");
    const OTPCode = document.querySelector('#input-code')?.value?.trim();

    // Validasi basic
    if (!otpEmail) throw new Error('Session expired. Please request OTP again.');
    if (!OTPCode) throw new Error('Please enter OTP code.');

    // Loading state
    OTPoutput.innerHTML = `<p>Verifying...</p>`;

    // Request ke server
    const res = await fetch(`${API}/api/auth/otp-verify`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        OTPCode,
        otpEmail
      })
    });

    // Handle response aman
    let data = {};
    try {
      data = await res.json();
    } catch {
      // kalau bukan JSON, biarin aja kosong
    }

    if (!res.ok) {
      throw new Error(data.msg || 'Verification failed');
    }

    // Success
    OTPoutput.innerHTML = `<p style="color:green;">Account verified! Redirecting...</p>`;

    // Bersihin data biar gak dipake ulang
    localStorage.removeItem("otpEmail");

    // Delay biar user sempet baca
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);

  } catch (error) {
    console.error(error);

    OTPoutput.innerHTML = `
      <p style="color:red;">
        ${error.message || 'Something went wrong'}
      </p>
    `;
  }
};

const ResendEmail = async () => {
  try {
    const otpEmail = localStorage.getItem('otpEmail');

    const res = await fetch(`${API}/api/auth/resend`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: otpEmail 
      }),
      credentials: "include"
    });

    let data = {};
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error(data.msg || 'Failed to resend OTP');
    }

    // 🔥 DI SINI TEMPAT YANG BENAR
    if (data.otp && otpCodeShow) {
      otpCodeShow.innerHTML = `
        <p style="color:blue;">
          Your OTP Code: <b>${data.otp}</b>
        </p>
      `;
    }

    OTPoutput.innerHTML = `
      <p>New OTP Code has been sent</p>
    `;

  } catch (error) {
    console.log(error);
    OTPoutput.innerHTML = `
      <p>${error.message}</p>
    `;
  }
};