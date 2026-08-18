-- Bootstrap : donne le rôle administrateur au compte propriétaire.
-- Requiert que l'utilisateur existe déjà dans auth.users (créé via l'app ou le dashboard).
-- Si le compte n'existe pas encore : créez-le d'abord, puis exécutez le même INSERT dans le SQL editor,
-- ou consultez l'espace admin une fois le rôle attribué.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'an.bahida@edu.umi.ac.ma'
ON CONFLICT (user_id, role) DO NOTHING;
