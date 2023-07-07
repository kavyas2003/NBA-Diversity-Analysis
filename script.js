
function finalProject(){
    let filePath="NBAstats.csv";
    plotFunctions(filePath);
}

let plotFunctions = function(filePath){
  d3.csv(filePath).then(function(data){
    let seasonList = [];
    data.forEach((row) => {
      let seasonNum = +(row.season.split("-")[0]);
      if (!seasonList.includes(seasonNum)) {
        seasonList.push(seasonNum);
      } 
    });
  const yearMenu = document.getElementById('yearMenu');

  seasonList.forEach((year) => {
  const option = document.createElement('option');
  option.value = year; 
  option.text = year; 
  yearMenu.appendChild(option); 
});
  
  createNodeLinkMap(data);  
  createChoropleth(data);
  createBarChart(data);
    });
}

function recreateNodeLinkMap(year) {
  let filePath="NBAstats.csv";
  d3.csv(filePath).then(function(data){
    createNodeLinkMap(data);  
    });
}


function createNodeLinkMap(data1) {
  var yearVal = document.getElementById('yearMenu').selectedOptions[0].value;
    let filteredData = data1.filter(function (d) {
    let season_num = +(d.season.split("-")[0]);
    return season_num == +yearVal;
  });

  let data = filteredData;
  const links = [];
  const teamNodes = new Set(data.map((d) => d.team_abbreviation));

  data.forEach((d) => {
    links.push({
      source: d.college,
      target: d.player_name,
      type: 'college-player',
    });
    if (teamNodes.has(d.team_abbreviation)) {
      links.push({
        source: d.team_abbreviation,
        target: d.player_name,
        type: 'team-player',
      });
    }
  });

  const nodeCounts = {};
  links.forEach((link) => {
    nodeCounts[link.source] = (nodeCounts[link.source] || 0) + 1;
    nodeCounts[link.target] = (nodeCounts[link.target] || 0) + 1;
  });
  const nodes = [
    ...new Set([
      ...data.map((d) => d.player_name),
      ...data.map((d) => d.team_abbreviation),
      ...data.map((d) => d.college),
    ]),
  ].map((d) => {
    const hasPlayerName = data.map(item => item.player_name).includes(d);
    const hasTeamAbbreviation = data.map(item => item.team_abbreviation).includes(d);
    
    let type = '';
    if (hasPlayerName) {
      type = 'player';
    } else if (hasTeamAbbreviation) {
      type = 'team';
    } else {
      type = 'college';
    }
    return {
      name: d,
      type: type,
      count: nodeCounts[d] || 0,
    };
  });


  const margin = { top: 100, bottom: 100, left: 100, right: 100 };
  const width = 1200 - margin.left - margin.right;
  const height = 1200 - margin.top - margin.bottom;

  const color = d3.scaleOrdinal()
    .domain(['player', 'team', 'college'])
    .range(['skyblue', 'yellow', 'lightgreen']);

    const svgContainer = d3.select('#plot_1');
    let svg = svgContainer.select('svg');
  
    if (svg.empty()) {
      svg = svgContainer.append('svg')
        .attr('width', width)
        .attr('height', height);
    } else {
      svg.selectAll('*').remove();
    }
  
    const svgWidth = +svg.attr('width');
    const svgHeight = +svg.attr('height');
  
    const container = svg.append('g')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.name).distance(100))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter((width - margin.left - margin.right)/2 - 1000, (height - margin.top - margin.bottom)/2 - 1000));

  const link = container.selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .style('stroke', 'grey')
    .style('stroke-width', '3px')
    .style('stroke-dasharray', (d) => d.type.includes('team') ? '4 4' : 'none')
    .on('click', clickLink);

  const radiusScale = d3.scaleLinear()
    .domain([0, d3.max(nodes.filter((d) => d.type === 'college'), (d) => d.count)])
    .range([12, 20]);

  const node = container.selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', (d) => {
      if (d.type === 'college') {
        return radiusScale(d.count);
      } else if (d.type === 'team' || d.type === 'player') {
        return 10;
      }
    })
    .style('fill', (d) => color(d.type))
    .on('click', clicked);

  const text = container.selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .text((d) => d.name)
    .style('font-size', '10px')
    .style('text-anchor', 'middle')
    .style('fill', 'black');

    const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('text-align', 'center')
    .style('padding', '4px')
    .style('font-size', '16px')
    .style('font-family', 'Arial, sans-serif')
    .style('background', 'lightgray')
    .style('border', '0px')
    .style('border-radius', '4px')
    .style('pointer-events', 'none');


  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - margin.right - 120}, ${margin.top + 20})`);

  legend.append('rect')
    .attr('width', 16)
    .attr('height', 16)
    .attr('x', 100)
    .attr('y', -100)
    .style('fill', color('player'));

  legend.append('text')
    .attr('x', 120)
    .attr('y', -88)
    .style('font-size', '12px')
    .text('Player');

  legend.append('rect')
    .attr('width', 16)
    .attr('height', 16)
    .attr('x', 100)
    .attr('y', -75)
    .style('fill', color('team'));

  legend.append('text')
    .attr('x', 120)
    .attr('y', -65)
    .style('font-size', '12px')
    .text('Team');

  legend.append('line')
    .attr('x1', 85)
    .attr('y1', -20)
    .attr('x2', 115)
    .attr('y2', -20)
    .style('stroke', 'grey')
    .style('stroke-dasharray', '4 4')
    .style('stroke-width', '3px');

  legend.append('text')
    .attr('x', 120)
    .attr('y', -18)
    .style('font-size', '12px')
    .text('Player to Team');

  legend.append('rect')
    .attr('width', 16)
    .attr('height', 16)
    .attr('x', 100)
    .attr('y', -50)
    .style('fill', color('college'));

  legend.append('text')
    .attr('x', 120)
    .attr('y', -40)
    .style('font-size', '12px')
    .text('College');

  legend.append('line')
    .attr('x1', 85)
    .attr('y1', 0)
    .attr('x2', 115)
    .attr('y2', 0)
    .style('stroke', 'gray')
    .style('stroke-width', '3px')

  legend.append('text')
    .attr('x', 120)
    .attr('y', 5)
    .style('font-size', '12px')
    .text('Player to College');

  simulation.on("tick", function () {
      link.attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);

    text.attr('x', (d) => d.x)
      .attr('y', (d) => d.y);
  });

  const zoom = d3.zoom().on('zoom', zoomed);
  svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.2));
  svg.call(zoom);

  function zoomed(event) {
    container.attr('transform', event.transform.translate(width / 2, height / 2));
  }

  function clickLink(event, d) {
    link.style('stroke', (l) => {
      if (l === d) {
        return 'black';
      } else {
        return 'grey';
      }
    });
      link.style('stroke-width', (l) => {
        if (l === d) {
          return '4px';
        } else {
          return '3px';
        }
      });
      link.on('mouseover', (event, d) => {
        tooltip.transition().duration(10).style('opacity', 0.9);
          tooltip.html(`${d.source.name} -> ${d.target.name}`)
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY}px`);
      });
      
      link.on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }

  function clicked(event, d) {
    const Xposition = -500 - d.x;
    const Yposition = -500 - d.y;
    link.on('mouseover', (event, d) => {
      tooltip.transition().duration(10).style('opacity', 0.9);
        tooltip.html(`${d.source.name} -> ${d.target.name}`)
        .style('left', `${event.pageX}px`)
        .style('top', `${event.pageY}px`);
    });
    
    link.on('mouseout', () => {
      tooltip.transition().duration(500).style('opacity', 0);
    });


    node.transition().duration(1000).attr('transform', `translate(${Xposition}, ${Yposition})`)
    link.transition().duration(1000).attr('transform', `translate(${Xposition}, ${Yposition})`)
    text.transition().duration(1000).attr('transform', `translate(${Xposition}, ${Yposition})`)
  
    svg.transition().duration(1000).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
    );

    link.style('stroke', (l) => {
        if (l.source === d || l.target === d) {
          return 'black';
        } else {
          return 'grey';
        }
      })

    text.style('font-weight', (t) => {
      return t === d ? 'bold' : 'normal';
    });
  }

  d3.select('#resetButton').on('click', reset);

  function reset() {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.2));
    simulation.force('center', d3.forceCenter((width - margin.left - margin.right)/2 - 1000, (height - margin.top - margin.bottom)/2 - 1000));
    simulation.alpha(1).restart();
  }
  
  svg.append("text")
  .attr("x", width / 2)
  .attr("y", 40)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .text("The NBA Network: Mapping Players, Teams, and Colleges");
}

function createChoropleth(data) {
  const countryCounts = {};

  data.forEach((d) => {
    let country = d.country;
    if (d.country == "USA") {
      country = "United States of America";
    }
    if (country in countryCounts) {
      countryCounts[country]++;
    } else {
      countryCounts[country] = 1;
    }
  });

  const margin = { top: 20, right: 20, bottom: 90, left: 20 };
  const width = 1000 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  const svg = d3
    .select("#plot_2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("text-align", "center")
    .style("padding", "4px")
    .style("font-size", "12px")
    .style("font-family", "Arial, sans-serif")
    .style("background", "lightgray")
    .style("border", "0px")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

    const counts = Object.values(countryCounts);
    const color = d3
      .scaleQuantile()
      .domain(counts)
      .range(d3.schemeBlues[9])
      .unknown("lightblue");

    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    svg.call(zoom);
    
    function zoomed(event) {
      svg.attr("transform", event.transform);
    }

  d3.json("countries.geojson").then((geojson) => {
    const projection = d3
      .geoNaturalEarth1()
      .fitSize([width, height], geojson);

    const path = d3.geoPath(projection);

    svg
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => color(countryCounts[d.properties.ADMIN]))
      .on("mouseover", onMouseOver)
      .on("mouseout", onMouseOut);

      function onMouseOver(event, d) {
        const country = d.properties ? d.properties.ADMIN || '' : '';
        const count = countryCounts[country] || 0;
        tooltip
          .html(`${country}: ${count} players`)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px")
          .style("opacity", 1);
      }

    function onMouseOut() {
      tooltip.style("opacity", 0);
    }
  });

  const legendWidth = 120;
  const legendHeight = 20;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - legendWidth- 400}, ${height - legendHeight})`);

  const legendScale = d3
    .scaleLinear()
    .domain([0, d3.max(counts)])
    .range([0, legendWidth]);

  const colorDomain = color.quantiles();

  const legendGradient = legend
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("x2", legendWidth);

  legendGradient
    .selectAll("stop")
    .data(colorDomain)
    .enter()
    .append("stop")
    .attr("offset", (d, i) => `${(i / (colorDomain.length - 1)) * 100}%`)
    .attr("stop-color", (d, i) => color(d));

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)")
    .style("stroke", "black");

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".0f"));

  legend
    .append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

    legend.append("text")
    .attr("x", width/2 - 420)
    .attr("y", margin.top/2 - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Number of Players");

    svg.append("text")
    .attr("x", width / 2)
    .attr("y", 80 - margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Global Distribution of NBA players");
}

function createBarChart(data) {
  const countryAvgDraft = {};

  data.forEach((d) => {
    const draftNumber = parseFloat(d.draft_number);

    if (!isNaN(draftNumber)) {
      if (d.country in countryAvgDraft) {
        countryAvgDraft[d.country].total += draftNumber;
        countryAvgDraft[d.country].count++;
      } else {
        countryAvgDraft[d.country] = {
          total: draftNumber,
          count: 1,
        };
      }
    }
  });

  const avgDraftData = Object.keys(countryAvgDraft)
    .filter((country) => countryAvgDraft[country].count > 0)
    .map((country) => ({
      country,
      avgDraft: countryAvgDraft[country].total / countryAvgDraft[country].count,
      count: countryAvgDraft[country].count,
    }));

  avgDraftData.sort((a, b) => a.country.localeCompare(b.country));

  const margin = { top: 40, right: 20, bottom: 100, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select('#plot_3')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .range([0, width])
    .padding(0.1)
    .domain(avgDraftData.map((d) => d.country));

  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(avgDraftData, (d) => d.avgDraft)]);

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('text-align', 'center')
    .style('padding', '4px')
    .style('font-size', '12px')
    .style('font-family', 'Arial, sans-serif')
    .style('background', 'lightgray')
    .style('border', '0px')
    .style('border-radius', '4px')
    .style('pointer-events', 'none');

  svg
    .selectAll('.bar')
    .data(avgDraftData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(d.country))
    .attr('y', (d) => y(d.avgDraft))
    .attr('width', x.bandwidth())
    .style('fill', 'lightblue')
    .attr('height', (d) => height - y(d.avgDraft))
    .on('mouseover', onMouseOver)
    .on('mouseout', onMouseOut);

  function onMouseOver(event, d) {
    const { country, count, avgDraft } = d;
    tooltip
      .html((d) => `${country}<br>Players: ${count}<br>Avg Draft: ${avgDraft.toFixed(0)}`)

      .style('left', event.pageX + 'px')
      .style('top', event.pageY - 28 + 'px')
      .style('opacity', 1);
  }

  function onMouseOut() {
    tooltip.style('opacity', 0);
  }

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('font-size', '8px')
    .style('text-anchor', 'end');

  svg.append('g').call(d3.axisLeft(y));

  svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 60)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("State");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height/2)
  .attr("y", -30)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Average Draft Number");

  svg.append("text")
  .attr("x", width / 2)
  .attr("y", 0 - margin.top / 2)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .text("Average Draft Number by Country");
}
