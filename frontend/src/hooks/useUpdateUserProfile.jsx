import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Custom hook that updates the user profile
const useUpdateUserProfile = (authUser, setCoverImg, setProfileImg) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: updateProfile, isPending: isUpdating } = useMutation({
        mutationFn: async (formData) => {

            const res = await fetch("/api/users/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            return data;
        },

        onSuccess: (data) => {
            toast.success("Profile updated successfully");

            // If the username has been changed we need to update the URL with the new username, otherwise the invalidatin will not work (it will try to fetch data from URL with the old username which already does not exist	in the DB)
            if (data.username !== authUser.username) { // data.usrname is the API response with the updated user data // authUser.username is the username from the authenticated user data (still the old one until the authUser is refetched)
                navigate(`/profile/${data.username}`);
            }

            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }) // for case when authUser updates his profile so the logout div in the botton left is also updated
            ]);

            setCoverImg(null);
            setProfileImg(null);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    return {
        updateProfile,
        isUpdating
    };
};

export default useUpdateUserProfile;