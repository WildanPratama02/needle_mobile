import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/envelope.dart';

/// The typed outcome of one API call. Repositories switch over it; nothing
/// above `data/` ever sees a `DioException`.
sealed class ApiResult<T> {
  const ApiResult();
}

final class ApiSuccess<T> extends ApiResult<T> {
  const ApiSuccess(this.data, [this.meta = const ApiMeta()]);

  final T data;
  final ApiMeta meta;
}

final class ApiFailure<T> extends ApiResult<T> {
  const ApiFailure(this.error);

  final AppError error;
}
