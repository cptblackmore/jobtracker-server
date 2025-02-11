module.exports = class UserDto {
  email;
  id;
  isActivated;
  nextResendAt;

  constructor(model) {
    this.email = model.email;
    this.id = model._id;
    this.isActivated = model.isActivated;
    this.nextResendAt = model.nextResendAt;
  }
}
