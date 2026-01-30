-- Create trigger on auth.users to handle new user creation
-- This trigger calls handle_new_user which creates profile and assigns role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();