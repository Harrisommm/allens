import admin from 'firebase-admin';

export const createUser = async (req, res) => {
const {
  email,
  password,
  firstName,
  lastName,
  photoUrl
} = req.body;
  const user = await admin.auth().createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`,
    photoURL: photoUrl
  });

  return res.send(user);
}