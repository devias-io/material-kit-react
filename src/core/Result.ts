import { Exception } from './Exceptions/Exception';

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: Exception;
  private readonly _value?: T;

  constructor(isSuccess: boolean, error?: Exception, value?: T) {
    if (isSuccess && error) throw new Error('Internal Error');

    if (!isSuccess && !error) throw new Error('Internal Error');

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: Exception): Result<U> {
    return new Result<U>(false, error);
  }

  public get value(): T {
    return this._getValue();
  }

  private _getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cant return value from a failure result');
    }

    return this._value as T;
  }
}
