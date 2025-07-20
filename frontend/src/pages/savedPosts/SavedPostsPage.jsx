import React from 'react'
import toast from 'react-hot-toast';

import { useQueryClient, useMutation } from '@tanstack/react-query';

import Posts from '../../components/common/Posts'

import { IoSettingsOutline } from 'react-icons/io5';

const SavedPostsPage = () => {

    const queryClient = useQueryClient();

    const feedType = "saved";

    // Mutation for unsaving all posts
    const { mutate: unsaveAllPosts, isPending: isUnsavingAllPosts } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/posts/unsave", {
                method: "POST"
            })

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            return data;
        },
        onSuccess: () => {
            toast.success("All posts unsaved successfully")
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message)
        }
    });

    const handleUnsaveAllPosts = () => {
        unsaveAllPosts();
    }
    return (
        <div className='flex-[4_4_0] border-l border-r border-gray-700 min-h-screen'>
            <div className='flex justify-between items-center p-4 border-b border-gray-700'>
                <p className='font-bold'>Saved Posts</p>
                <div className='dropdown '>
                    <div tabIndex={0} role='button' className='m-1'>
                        <IoSettingsOutline className='w-4' />
                    </div>
                    <ul
                        tabIndex={0}
                        className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
                    >
                        <li>
                            {isUnsavingAllPosts ? "Unsaving all posts..." : <a onClick={handleUnsaveAllPosts}>Unsave All Posts</a>}
                        </li>
                    </ul>
                </div>
            </div>
            <Posts feedType={feedType} />
        </div>
    )
}

export default SavedPostsPage
