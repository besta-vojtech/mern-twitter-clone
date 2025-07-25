import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner.jsx"

import { formatPostDate } from "../../utils/date/index.js";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const Post = ({ post }) => {
	const [comment, setComment] = useState("");

	const queryClient = useQueryClient();

	// Fetching the authenticated user
	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/auth/me", {
					method: "GET",
				});

				const data = await res.json();
				if (data.error) {
					return null;
				}
				if (!res.ok) {
					throw new Error(data.error) || "Something went wrong";
				}

				return data;
			} catch (error) {
				console.error(error);
				throw new Error(error);
			}
		},

		retry: false, // do not retry the query if it fails
	});

	const postOwner = post.user;
	const isMyPost = authUser?._id === postOwner._id;
	const isLiked = post.likes.includes(authUser?._id);
	const isSaved = authUser?.savedPosts.includes(post._id);
	const formattedDate = formatPostDate(post.createdAt);

	// Deleting a post mutation
	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/${post._id}`, {
					method: "DELETE",
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			Promise.all([
				//Invalidate the posts query to refetch the posts
				queryClient.invalidateQueries({ queryKey: ["posts"] }),
				// Invalidate the user posts count query to update the count
				queryClient.invalidateQueries({ queryKey: ["userPostsCount"] })
			])
		}
	});

	// Liking a post mutation
	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/like/${post._id}`, {
					method: "POST",
				});

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				return data;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: (updatedLikes) => {
			// This is not the best UX, because it will refetch all posts
			// queryClient.invalidateQueries({ queryKey: ["posts"] });

			// Instead, we can just update the post in the cache
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: updatedLikes, }; // Update the likes array with the new likes
					}
					return p; // Return the post as is if it doesn't match (it's not the post we liked/unliked)
				})
			})
		},
		onError: (error) => {
			toast.error(error.message);
		}
	});

	// Commenting on a post mutaion
	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/comment/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: comment }),
				});

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				return data;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: (post) => {
			toast.success("Comment posted successfully");
			setComment(""); // Clear the comment input
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		}
	});

	// Saving/unsaving a post mutation
	const { mutate: saveUnsave, isPending: isSavingUnsaving } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/save/${post._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			})

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Something went wrong");
			}

			return data;
		},
		onSuccess: () => {
			if (!isSaved) {
				toast.success("Post saved successfully")
			} else {
				toast.success("Post unsaved successfully")
			}
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message)
		}
	});

	const handleDeletePost = () => {
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (isCommenting) return; // Prevent multiple clicks while commenting
		commentPost();
	};

	const handleLikePost = () => {
		if (isLiking) return; // Prevent multiple clicks while liking/unliking
		likePost();
	};

	const handleSaveUnsavePost = () => {
		saveUnsave();
	};

	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && (<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />)}

								{isDeleting && <LoadingSpinner size='sm' />}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						<span>{post.text}</span>
						{post.img && (
							<img
								src={post.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>
							{/* We're using Modal Component from DaisyUI */}
							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? <LoadingSpinner size="md" /> : "Post"}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>
							<div className='flex gap-1 items-center group cursor-pointer'>
								{/* {<BiRepost className='w-6 h-6  text-slate-500 group-hover:text-green-500' />} */} {/* Repost icon is not implemented yet */}
								{/* {<span className='text-sm text-slate-500 group-hover:text-green-500'>0</span>} */} {/* Repost count is not implemented yet */}
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size='sm' />}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
								)}
								{isLiked && !isLiking && <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />}

								<span
									className={`text-sm group-hover:text-pink-500 ${isLiked ? "text-pink-500" : "text-slate-500"
										}`}
								>
									{post.likes.length}
								</span>
							</div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center' onClick={handleSaveUnsavePost}>
							{isSavingUnsaving && <LoadingSpinner size='sm' />}
							{!isSaved && !isSavingUnsaving && <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />}
							{isSaved && !isSavingUnsaving && <FaBookmark className='w-4 h-4 text-primary opacity-80 cursor-pointer' />}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
export default Post;