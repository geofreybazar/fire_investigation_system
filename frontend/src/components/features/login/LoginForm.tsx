import { useEffect } from "react";
import { useNavigate } from "react-router";
import useLogin from "@/hooks/auth/useLogin";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginType, loginSchema } from "@/interface/login";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useUserStore } from "@/store/userStore";

import { isAxiosError } from "axios";

// The server's message (e.g. wrong credentials), or a readable fallback when
// there is none, such as when the server can't be reached.
const loginErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Can't reach the server. Check your connection and try again.";
    }
    return error.response.data?.message ?? "Login failed. Please try again.";
  }
  return "Login failed. Please try again.";
};

const LoginForm = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const { login, isPending, isError, error, isSuccess, data } = useLogin();

  const { handleSubmit, control } = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      account_number: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginType) => {
    await login(data);
  };

  useEffect(() => {
    if (isSuccess && data) {
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      navigate("/");
    }
  }, [isSuccess, data, setUser, navigate]);

  return (
    <form
      className='flex flex-col gap-4 mt-2'
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Controller
          name='account_number'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='login-account-number'>
                Account number
              </FieldLabel>
              <Input
                {...field}
                id='login-account-number'
                aria-invalid={fieldState.invalid}
                placeholder='e.g. B13084'
                autoComplete='username'
                autoCapitalize='characters'
                autoFocus
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='password'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='login-password'>Password</FieldLabel>
              <Input
                {...field}
                type='password'
                id='login-password'
                aria-invalid={fieldState.invalid}
                autoComplete='current-password'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type='submit'
        disabled={isPending}
        className='w-full font-medium rounded-xl transition'
      >
        {isPending ? "Signing In..." : "Sign In"}
      </Button>

      {isError && (
        <p
          role='alert'
          className='text-center text-sm font-medium text-destructive'
        >
          {loginErrorMessage(error)}
        </p>
      )}
    </form>
  );
};

export default LoginForm;
