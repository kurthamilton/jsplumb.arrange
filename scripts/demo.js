(function() {
    jsPlumb.ready(function() {
        jsPlumb.setContainer('workflow');
        var transitions = getTransitions();

        jsPlumb.arranger = arranger.initialize({
            stateSelector: '.state',
            transitions: transitions
        }).calculate();

        addTransitions(transitions);
    });

    function addTransitions(transitions) {
        transitions.forEach(function(transition, i) {
            var options = {
                source: transition.source,
                target: transition.target,
                anchors: jsPlumb.arranger.getTransitionAnchor(i),
                endpoint: ['Dot', {
                    radius: 5
                }],
                // TODO: reduce size. Docs state { width: x } should work, but doesn't. Why?
                overlays: ['PlainArrow']
            };

            if (transition.source !== transition.target) {
                // self-referencing transitions show as a loop, not straight flowchart-style
                options.connector = ['Flowchart'];
            }

            jsPlumb.connect(options);
        });
    }

    function getTransitions() {
        var transitions = [{
            source: 'state-1A',
            target: 'state-1B'
        }, {
            source: 'state-1A',
            target: 'state-1A'
        }, {
            source: 'state-1B',
            target: 'state-2A'
        }, {
            source: 'state-2A',
            target: 'state-1A'
        }, {
            source: 'state-2A',
            target: 'state-2B'
        }];

        transitions.forEach(function(transition, i) {
            transition.id = i;
        });

        return transitions;
    }
})();