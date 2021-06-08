# Generated by Django 3.1.5 on 2021-01-28 03:12


import h1st.h1flow.h1flow

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = ('H1stModel', '0001_initial'),

    operations = \
        migrations.CreateModel(
            name='Workflow',

            fields=[
                ('model_ptr',
                 models.OneToOneField(
                    auto_created=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    parent_link=True,
                    primary_key=True,
                    related_name='h1st_workflows',
                    serialize=False,
                    to='H1stModel.model'))
            ],

            options={
                'verbose_name': 'H1st Workflow',
                'verbose_name_plural': 'H1st Workflows',
                'db_table': 'H1stModel_Workflow',
                'ordering': ('-modified',),
                'permissions': (),
                'get_latest_by': 'modified',
                'abstract': False,
                'managed': True,
                'proxy': False,
                'default_permissions': ('add', 'change', 'delete', 'view'),
                'select_on_save': False,
                'default_related_name': 'h1st_workflows',
                'required_db_features': (),
                'base_manager_name': 'objects',
                'default_manager_name': 'objects'
            },

            bases=('H1stModel.model',
                   h1st.core.graph.Graph)
        ),
