

def upload():
    return 'local_runner'


def tophat():
    return 'site_dest_id'


def tool1():
    # tool1 is id to test tool mocked out in test_mapper.py, without specify
    # function name in dynamic destination - this function should be used by
    # default.
    return 'tool1_dest_id'


def check_rule_params(
    job_id,
    tool,
    tool_id,
    job_wrapper,
    rule_helper,
    app,
    job,
    user,
    user_email,
):
    assert job_id == 12345
    assert tool.is_mock_tool()
    assert tool_id == "testtoolshed/devteam/tool1/23abcd13123"
    assert job_wrapper.is_mock_job_wrapper()
    assert app == job_wrapper.app
    assert rule_helper is not None

    assert job.user == user
    assert user.id == 6789
    assert user_email == "test@example.com"

    return "all_passed"


def check_resource_params( resource_params ):
    assert resource_params["memory"] == "8gb"
    return "have_resource_params"