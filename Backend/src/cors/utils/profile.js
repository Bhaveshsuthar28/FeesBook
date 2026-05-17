export function checkProfileCompletion(
  principal
) {
  return Boolean(
    principal.mobile &&
    principal.schoolName
  );
}