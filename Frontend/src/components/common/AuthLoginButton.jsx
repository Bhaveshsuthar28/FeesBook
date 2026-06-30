import {
  forwardRef,
} from "react";

import {
  FcGoogle,
} from "react-icons/fc";

const variantClass = {
  outline:
    "border border-slate-200 bg-white text-slate-750 shadow-sm hover:bg-slate-50 hover:border-slate-350 hover:text-slate-900",
  solid:
    "border border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-700",
};

const iconClass = {
  outline:
    "flex items-center justify-center bg-white rounded-full p-0.5",
  solid:
    "flex items-center justify-center bg-white rounded-full p-1",
};

const AuthLoginButton =
  forwardRef(function AuthLoginButton(
    {
      variant = "outline",
      className = "",
      ...props
    },
    ref
  ) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={`
        inline-flex
        h-11
        items-center
        justify-center
        gap-3
        rounded-xl
        px-5
        text-sm
        font-bold
        transition-all
        duration-200
        focus:outline-none
        focus:ring-4
        focus:ring-blue-100
        ${variantClass[variant]}
        ${className}
      `}
    >
      <span
        className={`
          flex
          h-7
          w-7
          items-center
          justify-center
          ${iconClass[variant]}
        `}
      >
        <FcGoogle className="h-5.5 w-5.5" />
      </span>

      <span>Sign in with Google</span>
    </button>
  );
});

export default AuthLoginButton;

