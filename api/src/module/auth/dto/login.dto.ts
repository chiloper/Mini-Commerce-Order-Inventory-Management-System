import { Transform, type TransformFnParams } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator"

export class LoginDto {

  @IsEmail({}, { message: "A valid email address is required." })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === "string" ? value.trim().toLocaleLowerCase() : (value as unknown)
  )
  email!: string;

  @IsString()
  @MinLength(8,{message: "Password must be at least 8 characters."})
  @MaxLength(72,{message: "Password must be at most 72 characters."})
  password!: string;
}