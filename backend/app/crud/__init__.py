# backend/app/crud/init.py
from .crud_user import get_user, get_user_by_email, create_user
from .crud_subject import get_subject, get_subjects_by_owner, create_subject, update_subject, delete_subject
from .crud_topic import get_topic, get_topics_by_subject, create_topic, update_topic, delete_topic
from .crud_study_plan import (
get_study_plan, get_active_study_plan_for_subject,
create_study_plan_with_blocks, update_study_plan,
get_study_block, update_study_block
)
from .crud_study_material import (
    create_study_material, get_study_material, get_study_materials_for_subject, 
    update_study_material, delete_study_material,update_material_tags
)
from .crud_achievement import(
    get_all_defined_achievements,get_user_achievements
)