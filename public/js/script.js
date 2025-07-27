document.addEventListener('DOMContentLoaded', function() {
    // ================ DOM ELEMENTS ================
    const feed = document.getElementById('feed');
    const floatingBtn = document.getElementById('floatingBtn');
    const dropdownContent = document.getElementById('dropdownContent');
    const newPostBtn = document.getElementById('newPostBtn');
    const editPostBtn = document.getElementById('editPostBtn');
    const postModal = document.getElementById('postModal');
    const modalTitle = document.getElementById('modalTitle');
    const postForm = document.getElementById('postForm');
    const postIdInput = document.getElementById('postId');
    const postTitleInput = document.getElementById('postTitle');
    const postContentInput = document.getElementById('postContent');
    const closeModal = document.querySelector('.close');

    // ================ STATE MANAGEMENT ================
    let deletedPosts = []; // Stores deleted posts for undo functionality

    // ================ EVENT LISTENERS ================
    floatingBtn.addEventListener('click', handleFloatingBtnClick);
    document.addEventListener('click', closeDropdown);
    newPostBtn.addEventListener('click', handleNewPostClick);
    editPostBtn.addEventListener('click', handleEditPostClick);
    closeModal.addEventListener('click', closeModalHandler);
    window.addEventListener('click', handleOutsideClick);
    postForm.addEventListener('submit', handlePostSubmit);

    // ================ INITIALIZATION ================
    loadPosts();

    // ================ EVENT HANDLERS ================
    function handleFloatingBtnClick(e) {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    }

    function closeDropdown() {
        dropdownContent.classList.remove('show');
    }

    function handleNewPostClick(e) {
        e.preventDefault();
        modalTitle.textContent = 'New Post';
        postIdInput.value = '';
        postTitleInput.value = '';
        postContentInput.value = '';
        postModal.style.display = 'block';
        dropdownContent.classList.remove('show');
    }

    function handleEditPostClick(e) {
        e.preventDefault();
        alert('Select a post to edit first (implementation needed)');
        dropdownContent.classList.remove('show');
    }

    function closeModalHandler() {
        postModal.style.display = 'none';
    }

    function handleOutsideClick(e) {
        if (e.target === postModal) {
            postModal.style.display = 'none';
        }
    }

    function handlePostSubmit(e) {
        e.preventDefault();
        
        const postData = {
            id: postIdInput.value,
            title: postTitleInput.value,
            content: postContentInput.value
        };

        if (postIdInput.value) {
            updatePost(postData);
        } else {
            createPost(postData);
        }

        postModal.style.display = 'none';
    }

    // ================ POST MANAGEMENT ================
    function loadPosts() {
        fetch('/api/posts')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(posts => {
                feed.innerHTML = '';
                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    feed.appendChild(postElement);
                });
            })
            .catch(error => {
                console.error('Error loading posts:', error);
                alert('Failed to load posts');
            });
    }

    function createPost(postData) {
        fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(loadPosts)
        .catch(error => {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        });
    }

    function updatePost(postData) {
        fetch(`/api/posts/${postData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(loadPosts)
        .catch(error => {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        });
    }

    // Modify your createPostElement function to include comment submission handling
// In script.js - Complete createPostElement function
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.id = post.id;

        // Post header with title and delete button
        const postHeader = document.createElement('div');
        postHeader.className = 'post-header';
        
        const postTitle = document.createElement('h2');
        postTitle.className = 'post-title';
        postTitle.textContent = post.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-post-btn';
        deleteBtn.textContent = 'Delete Post';
        deleteBtn.addEventListener('click', () => deletePost(post.id));
        
        postHeader.appendChild(postTitle);
        postHeader.appendChild(deleteBtn);

        // Post meta and content
        const postMeta = document.createElement('div');
        postMeta.className = 'post-meta';
        postMeta.textContent = `Posted on ${new Date(post.created_at).toLocaleDateString()}`;

        const postContent = document.createElement('div');
        postContent.className = 'post-content';
        postContent.textContent = post.content;

        // Comments section
        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments';
        commentsSection.innerHTML = '<h3>Comments</h3>';

        // Comment form
        const commentForm = document.createElement('form');
        commentForm.className = 'comment-form';
        commentForm.innerHTML = `
            <textarea placeholder="Add a comment..." required></textarea>
            <button type="submit">Post Comment</button>
        `;

        // Handle comment submission
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const textarea = this.querySelector('textarea');
            const commentText = textarea.value.trim();
            
            if (commentText) {
                submitComment(post.id, commentText, commentsSection);
                textarea.value = '';
            }
        });

        // Assemble the post
        postElement.appendChild(postHeader);
        postElement.appendChild(postMeta);
        postElement.appendChild(postContent);
        postElement.appendChild(commentsSection);
        postElement.appendChild(commentForm);

        // Load existing comments
        loadComments(post.id, commentsSection);

        return postElement;
    }

// Function to load comments for a post
function loadComments(postId, commentsContainer) {
    fetch(`/api/posts/${postId}/comments`)
        .then(response => response.json())
        .then(comments => {
            commentsContainer.querySelectorAll('.comment').forEach(c => c.remove());
            comments.forEach(comment => {
                commentsContainer.appendChild(createCommentElement(comment));
            });
        })
        .catch(error => console.error('Error loading comments:', error));
}

// Function to create a comment element
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-author">${comment.author || 'Anonymous'}</div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-meta">Posted at ${new Date(comment.created_at).toLocaleTimeString()}</div>
    `;
    return commentElement;
}

// Function to submit a new comment
function submitComment(postId, commentText, commentsContainer) {
    fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            post_id: postId,
            text: commentText,
            author: 'Current User' // Replace with actual user if you have auth
        })
    })
    .then(response => response.json())
    .then(newComment => {
        // Add the new comment to the UI immediately
        commentsContainer.appendChild(createCommentElement(newComment));
    })
    .catch(error => {
        console.error('Error submitting comment:', error);
        alert('Failed to post comment');
    });
    }
    // ================ DELETE FUNCTIONALITY ================
    function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        const postElement = document.querySelector(`.post[data-id="${postId}"]`);
        if (!postElement) return;

        const deleteBtn = postElement.querySelector('.delete-post-btn');
        
        // Show loading state
        postElement.classList.add('deleting');
        deleteBtn.innerHTML = '<div class="loading-spinner"></div> Deleting...';
        
        fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Delete failed');
            return response.json();
        })
        .then(() => {
            // Remove from UI
            postElement.remove();
        })
        .catch(error => {
            console.error('Error deleting post:', error);
            postElement.classList.remove('deleting');
            deleteBtn.textContent = 'Delete';
            alert('Failed to delete post');
        });
    }
});