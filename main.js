const API_URL = "http://localhost:3000";

// ==================== POSTS LOGIC ====================

async function LoadPosts() {
    try {
        let res = await fetch(`${API_URL}/posts`);
        let posts = await res.json();
        let body = document.getElementById("posts-body");
        body.innerHTML = "";

        // Sắp xếp ID giảm dần để dễ nhìn bài mới nhất
        // posts.sort((a, b) => parseInt(b.id) - parseInt(a.id)); 

        for (const post of posts) {
            // Kiểm tra isDeleted để thêm class CSS
            let rowClass = post.isDeleted ? "deleted-row" : "";
            
            // Nút xóa: Nếu đã xóa mềm rồi thì có thể disable hoặc ẩn đi, ở đây tôi vẫn để nhưng đổi text
            let deleteBtn = post.isDeleted 
                ? `<span style="color: #d9534f; font-size: 0.8em;">(Deleted)</span>` 
                : `<button class="btn-delete" onclick="SoftDeletePost('${post.id}')">Delete</button>`;

            // Nút edit: Đổ dữ liệu lên form
            let editBtn = !post.isDeleted 
                ? `<button onclick="EditPost('${post.id}', '${post.title}', '${post.views}')" style="margin-right:5px; background-color: #f0ad4e;">Edit</button>`
                : ``;

            body.innerHTML += `<tr class="${rowClass}">
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.views}</td>
                <td>
                    ${editBtn}
                    ${deleteBtn}
                </td>
            </tr>`;
        }
    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

async function SavePost() {
    let id = document.getElementById("post_id").value;
    let title = document.getElementById("post_title").value;
    let views = document.getElementById("post_views").value;

    if (!title) { alert("Title is required!"); return; }

    try {
        // CASE 1: UPDATE (Nếu có ID)
        if (id) {
            let res = await fetch(`${API_URL}/posts/${id}`, {
                method: 'PATCH', // Dùng PATCH để chỉ update trường thay đổi
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title, views: views })
            });
            if (res.ok) console.log("Post updated");
        } 
        // CASE 2: CREATE (Nếu ID trống)
        else {
            // Logic Auto ID: Lấy toàn bộ posts để tìm Max ID
            let allPostsRes = await fetch(`${API_URL}/posts`);
            let allPosts = await allPostsRes.json();
            
            // Tìm maxId. Lưu ý chuyển về Int để so sánh, mặc định là 0 nếu chưa có bài nào
            let maxId = allPosts.reduce((max, p) => Math.max(max, parseInt(p.id)), 0);
            let newId = (maxId + 1).toString(); // Yêu cầu ID là chuỗi

            let res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: newId, 
                    title: title, 
                    views: views,
                    isDeleted: false // Mặc định khi tạo mới chưa bị xóa
                })
            });
            if (res.ok) console.log("Post created with ID: " + newId);
        }
        
        ClearPostForm();
        LoadPosts();
    } catch (error) {
        console.error("Error saving post:", error);
    }
}

// Xóa mềm: Update isDeleted = true
async function SoftDeletePost(id) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        let res = await fetch(`${API_URL}/posts/${id}`, {
            method: 'PATCH', // Dùng PATCH thay vì PUT để không ghi đè mất các trường khác
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDeleted: true })
        });
        if (res.ok) {
            console.log("Post soft-deleted");
            LoadPosts();
        }
    } catch (error) {
        console.error(error);
    }
}

function EditPost(id, title, views) {
    document.getElementById("post_id").value = id;
    document.getElementById("post_title").value = title;
    document.getElementById("post_views").value = views;
}

function ClearPostForm() {
    document.getElementById("post_id").value = "";
    document.getElementById("post_title").value = "";
    document.getElementById("post_views").value = "";
}

// ==================== COMMENTS LOGIC ====================

async function LoadComments() {
    try {
        let res = await fetch(`${API_URL}/comments`);
        let comments = await res.json();
        let body = document.getElementById("comments-body");
        body.innerHTML = "";

        for (const comment of comments) {
            body.innerHTML += `<tr>
                <td>${comment.id}</td>
                <td>${comment.text}</td>
                <td>${comment.postId}</td>
                <td>
                    <button onclick="EditComment('${comment.id}', '${comment.text}', '${comment.postId}')" style="background-color: #f0ad4e;">Edit</button>
                    <button class="btn-delete" onclick="DeleteComment('${comment.id}')">Delete</button>
                </td>
            </tr>`;
        }
    } catch (error) {
        console.error("Error loading comments:", error);
    }
}

async function SaveComment() {
    let id = document.getElementById("comment_id").value;
    let text = document.getElementById("comment_text").value;
    let postId = document.getElementById("comment_post_id").value;

    if (!text || !postId) { alert("Text and Post ID are required!"); return; }

    try {
        if (id) {
            // Update Comment
            await fetch(`${API_URL}/comments/${id}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text, postId: postId })
            });
        } else {
            // Create Comment (Áp dụng logic Auto ID tương tự Posts cho chuyên nghiệp)
            let allCommentsRes = await fetch(`${API_URL}/comments`);
            let allComments = await allCommentsRes.json();
            let maxId = allComments.reduce((max, c) => Math.max(max, parseInt(c.id)), 0);
            let newId = (maxId + 1).toString();

            await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, text: text, postId: postId })
            });
        }
        ClearCommentForm();
        LoadComments();
    } catch (error) {
        console.error("Error saving comment:", error);
    }
}

async function DeleteComment(id) {
    if (!confirm("Delete this comment permanently?")) return;
    
    // Comments thường xóa cứng (Hard Delete) trừ khi có yêu cầu đặc biệt
    try {
        await fetch(`${API_URL}/comments/${id}`, { method: 'DELETE' });
        LoadComments();
    } catch (error) {
        console.error(error);
    }
}

function EditComment(id, text, postId) {
    document.getElementById("comment_id").value = id;
    document.getElementById("comment_text").value = text;
    document.getElementById("comment_post_id").value = postId;
}

function ClearCommentForm() {
    document.getElementById("comment_id").value = "";
    document.getElementById("comment_text").value = "";
    document.getElementById("comment_post_id").value = "";
}

// Khởi chạy khi trang load
LoadPosts();
LoadComments();